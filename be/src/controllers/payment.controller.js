import moment from "moment";
import mongoose from "mongoose";
import QRCode from "qrcode";
import { BOOKING_STATUS } from "../constants/booking.js";
import Booking from "../models/booking.model.js";
import Notification from "../models/notification.model.js";
import Product from "../models/product.model.js";
import Schedule from "../models/schedule.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import emailService from "../services/email.service.js";
import momoService from "../services/payment/momo.service.js";
import vnpayService from "../services/payment/vnpay.service.js";
import redisService from "../services/redis.service.js";
import smsService from "../services/sms.service.js";
import websocketService from "../services/websocket.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

/**
 * Helper function để confirm payment
 */
async function confirmPaymentSuccess(booking, paymentMethod, transactionId, paymentInfo = {}) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (booking.status === BOOKING_STATUS.COMPLETED) {
        return;
      }

      booking.status = BOOKING_STATUS.COMPLETED;
      booking.paymentDetails = {
        paymentMethod,
        transactionId,
        status: "Thành công",
        amount: booking.totalAmount,
        paymentDate: new Date(),
        paymentInfo: typeof paymentInfo === "string" ? paymentInfo : JSON.stringify(paymentInfo),
      };

      try {
        const qrData = booking.bookingCode;
        const qrCodeUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: "M",
          type: "image/png",
          quality: 0.92,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
          width: 256,
        });
        booking.qrCode = qrCodeUrl;
      } catch (qrError) {
        console.error("QR Code generation error:", qrError);
        booking.qrCode = null;
      }

      await booking.save({ session });
      const seatNumbers = booking.seats.map((s) => s.seatNumber);

      const confirmArrayFilters = seatNumbers.map((seatNum) => ({
        [`seat${seatNum.replace(/[^a-zA-Z0-9]/g, "")}.seatNumber`]: seatNum,
      }));

      const confirmSetUpdate = {};
      seatNumbers.forEach((seatNum) => {
        const placeholder = `seat${seatNum.replace(/[^a-zA-Z0-9]/g, "")}`;
        confirmSetUpdate[`seatAvailability.$[${placeholder}].isBooked`] = true;
        confirmSetUpdate[`seatAvailability.$[${placeholder}].bookedBy`] = booking._id;
        confirmSetUpdate[`seatAvailability.$[${placeholder}].holdUntil`] = null;
      });

      const finalizedSchedule = await Schedule.findOneAndUpdate(
          {
            _id: booking.schedule,
            $and: seatNumbers.map((seatNum) => ({
              seatAvailability: {
                $elemMatch: { seatNumber: seatNum, isBooked: false },
              },
            })),
          },
          {
            $set: confirmSetUpdate,
            $inc: { bookedSeatsCount: seatNumbers.length }
          },
          {
            arrayFilters: confirmArrayFilters,
            new: true,
            session,
          }
      );

      if (!finalizedSchedule) {
        throw new Error("RACE_CONDITION_LOST");
      }

      websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
        scheduleId: booking.schedule,
        seatAvailability: finalizedSchedule.seatAvailability,
        action: "booked",
        seatNumbers: seatNumbers,
      });

      const customer = await User.findById(booking.customer).session(session);
      if (customer) {
        const pointsEarned = Math.floor(booking.totalAmount / 10000);
        customer.loyaltyPoints += pointsEarned;

        const oldLevel = customer.membershipLevel;
        if (customer.loyaltyPoints >= 1000 && customer.membershipLevel === "Bạc") customer.membershipLevel = "Vàng";
        else if (customer.loyaltyPoints >= 5000 && customer.membershipLevel === "Vàng") customer.membershipLevel = "Bạch kim";

        await customer.save({ session });

        Promise.all([
          emailService.sendBookingConfirmation(booking, customer).catch((err) => console.error("Email error:", err)),
          customer.phoneNumber ? smsService.sendBookingConfirmation(customer.phoneNumber, booking).catch((err) => console.error("SMS error:", err)) : null,
          Notification.createNotification({
            user: customer._id,
            ...Notification.templates.bookingSuccess(booking),
          }).catch((err) => console.error("Notification error:", err)),
        ]).catch((err) => console.error("Notification error:", err));
      }

      redisService.del(`booking:temp:${booking._id}`).catch(() => {});
      redisService.invalidateScheduleCache(booking.schedule.toString()).catch(() => {});
    });
  } catch (error) {
    if (error.message === "RACE_CONDITION_LOST") {
      console.error(`Race condition detected for booking ${booking._id}. Initiating refund marking.`);
      booking.status = "Đã hủy";
      booking.paymentDetails = {
        paymentMethod,
        transactionId,
        status: "Giao dịch treo (Ghế hết)",
        amount: booking.totalAmount,
        paymentDate: new Date(),
        paymentInfo: typeof paymentInfo === "string" ? paymentInfo : JSON.stringify(paymentInfo),
      };
      booking.cancellationReason = "Lỗi hệ thống: Ghế đã bị người khác mua ngay lúc thanh toán";
      await booking.save();
      throw new Error("PAYMENT_SUCCESS_BUT_SEAT_TAKEN_REFUNDED");
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }
}

/**
 * Helper function để release seats khi payment fail
 */
async function handlePaymentFailure(booking) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (booking.status === BOOKING_STATUS.CANCELLED) return;

      booking.status = BOOKING_STATUS.CANCELLED;
      if (booking.paymentDetails) booking.paymentDetails.status = "Thất bại";
      await booking.save({ session });

      const schedule = await Schedule.findById(booking.schedule).session(session);
      if (schedule) {
        await schedule.releaseSeats(booking.seats.map((s) => s.seatNumber), session);
        websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
          scheduleId: booking.schedule,
          seatAvailability: schedule.seatAvailability,
          action: "released",
          seatNumbers: booking.seats.map((s) => s.seatNumber),
        });
      }

      if (booking.appliedVoucher) {
        await Voucher.findByIdAndUpdate(booking.appliedVoucher, {
          $inc: { usageCount: -1 },
          $pull: { usedBy: { bookingId: booking._id } },
        }, { session });
      }

      const customer = await User.findById(booking.customer).session(session);
      if (customer) {
        Promise.all([
          Notification.createNotification({
            user: customer._id,
            ...Notification.templates.paymentFailed(booking),
            channels: { inApp: true, email: true, sms: !!customer.phoneNumber },
          }).catch((err) => console.error("Payment failure notification error:", err)),
        ]).catch((err) => console.error("Payment failure notification error:", err));
      }

      redisService.del(`booking:temp:${booking._id}`).catch(() => {});
      redisService.invalidateScheduleCache(booking.schedule.toString()).catch(() => {});
    });
  } finally {
    await session.endSession();
  }
}

const paymentController = {

  createVnPayPayment: async (req, res) => {
    try {
      const bookingId = req.params.bookingId || req.params.id;
      const booking = await Booking.findById(bookingId).exec();

      if (!booking) {
        return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      }

      console.log(`⚠️ [DEV MODE] Đang giả lập VNPAY auto-success cho đơn: ${booking.bookingCode}`);

      // 🚀 CHẠY LUÔN HÀM CONFIRM ĐỂ CHỐT GHẾ, SINH QR VÀ GỬI EMAIL!
      await confirmPaymentSuccess(
          booking,
          "VNPAY",
          `MOCK_VNPAY_${Date.now()}`,
          { message: "Thanh toán giả lập thành công" }
      );

      // Đẩy ngược lại Frontend báo thành công
      const frontendSuccessUrl = `${process.env.FRONTEND_URL || 'https://movie-booking-cinema.vercel.app'}/booking-flow/success?bookingCode=${booking.bookingCode}`;

      return res.json({
        success: true,
        paymentUrl: frontendSuccessUrl,
      });

    } catch (error) {
      console.error("Create VNPay Payment Error:", error);
      return errorResponse(res, "Lỗi Server", 500);
    }
  },

  // VNPay return URL
  handleVNPayReturn: async (req, res) => {
    try {
      const vnpParams = req.query;
      const result = vnpayService.verifyReturnUrl(vnpParams);

      if (!result.verified) return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);

      const bookingCode = result.orderId.split("_")[0];
      const booking = await Booking.findOne({ bookingCode });

      if (!booking) return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Booking not found`);

      if (Math.abs(booking.totalAmount - result.amount) >= 1) {
        await handlePaymentFailure(booking);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Amount mismatch`);
      }

      if (result.isSuccess) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}`);
      } else {
        await handlePaymentFailure(booking);
        const message = vnpayService.getResponseMessage(result.responseCode);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  },

  // VNPay IPN (Instant Payment Notification)
  handleVNPayIPN: async (req, res) => {
    try {
      const vnpParams = req.query;
      const orderId = vnpParams["vnp_TxnRef"];
      const bookingCode = orderId ? orderId.split("_")[0] : null;

      let booking = null;
      if (bookingCode) {
        booking = await Booking.findOne({ bookingCode });
      }

      const result = await vnpayService.verifyIpn(vnpParams, booking);
      res.json(result);

      if (result.RspCode === "00" && booking && booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
        confirmPaymentSuccess(booking, "VNPAY", vnpParams["vnp_TransactionNo"], {
          bankCode: vnpParams["vnp_BankCode"],
          payDate: vnpParams["vnp_PayDate"],
        }).catch((err) => console.error("VNPay IPN processing error:", err));
      }
    } catch (error) {
      res.json({ RspCode: "99", Message: "Unknown error" });
    }
  },

  createMoMoPayment: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await Booking.findById(bookingId);
      if (!booking) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);

      if (booking.customer.toString() !== req.userId) return errorResponse(res, "Bạn không có quyền thanh toán đơn này", 403);
      if (booking.status !== "Chờ thanh toán") return errorResponse(res, "Đơn đặt vé không ở trạng thái chờ thanh toán", 400);

      const schedule = await Schedule.findById(booking.schedule);
      if (!schedule) return errorResponse(res, "Suất chiếu không tồn tại", 400);

      const unavailableSeats = booking.seats.filter(bookingSeat => {
        const scheduleSeat = schedule.seatAvailability.find(s => s.seatNumber === bookingSeat.seatNumber);
        return !scheduleSeat || scheduleSeat.isBooked;
      });

      if (unavailableSeats.length > 0) return errorResponse(res, `Ghế ${unavailableSeats.map(s => s.seatNumber).join(", ")} đã bị mua.`, 409);

      const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const result = await momoService.createPayment(booking, ipAddr);

      if (result.success) {
        booking.paymentDetails.transactionId = result.orderId;
        await booking.save();
        return successResponse(res, {
          paymentUrl: result.paymentUrl,
          deeplink: result.deeplink,
          qrCodeUrl: result.qrCodeUrl,
          orderId: result.orderId,
          requestId: result.requestId,
        });
      } else {
        return errorResponse(res, "Không thể tạo payment MoMo", 500);
      }
    } catch (error) {
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  handleMoMoReturn: async (req, res) => {
    try {
      const momoData = req.query;
      const result = momoService.verifySignature(momoData);

      if (!result.verified) return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);

      const bookingCode = result.orderId.split("_")[0];
      const booking = await Booking.findOne({ bookingCode });

      if (!booking) return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Booking not found`);

      if (result.isSuccess) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}`);
      } else {
        await handlePaymentFailure(booking);
        const message = momoService.getResultMessage(result.resultCode);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  },

  handleMoMoNotify: async (req, res) => {
    try {
      const momoData = req.body;
      const result = momoService.verifySignature(momoData);

      if (result.verified) {
        res.json({ resultCode: 0, message: "Success" });
        if (result.isSuccess) {
          const bookingCode = result.orderId.split("_")[0];
          const booking = await Booking.findOne({ bookingCode });

          if (booking && booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
            confirmPaymentSuccess(booking, "MoMo", result.transId, {
              message: result.message,
              orderInfo: result.orderInfo,
            }).catch((err) => console.error("MoMo notify processing error:", err));
          }
        }
      } else {
        res.json({ resultCode: 97, message: "Invalid signature" });
      }
    } catch (error) {
      res.json({ resultCode: 99, message: "Unknown error" });
    }
  },

  // ============================================
  // QUERY & REFUND
  // ============================================
  queryPaymentStatus: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await Booking.findById(bookingId);
      if (!booking) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);

      let result;
      if (booking.paymentDetails.paymentMethod === "VNPAY") {
        result = await vnpayService.queryTransaction(booking.paymentDetails.transactionId, booking.paymentDetails.paymentDate);
      } else if (booking.paymentDetails.paymentMethod === "MoMo") {
        result = await momoService.queryTransaction(booking.paymentDetails.transactionId, booking.bookingCode);
      }
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  refundPayment: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await Booking.findById(bookingId);
      if (!booking) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      if (booking.status !== "Đã hủy") return errorResponse(res, "Chỉ có thể hoàn tiền cho vé đã hủy", 400);

      let result;
      if (booking.paymentDetails.paymentMethod === "VNPAY") {
        result = await vnpayService.refundTransaction(booking.paymentDetails.transactionId, booking.refundAmount, booking.paymentDetails.paymentDate, req.userId);
      } else if (booking.paymentDetails.paymentMethod === "MoMo") {
        result = await momoService.refundTransaction(booking.bookingCode, booking.paymentDetails.transactionId, booking.refundAmount, "Hoàn tiền hủy vé");
      }

      if (result.success) {
        booking.paymentDetails.status = "Đã hoàn tiền";
        await booking.save();
        return successResponse(res, result, "Hoàn tiền thành công");
      } else {
        return errorResponse(res, "Hoàn tiền thất bại", 500);
      }
    } catch (error) {
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default paymentController;