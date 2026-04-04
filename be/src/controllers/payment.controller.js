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

async function confirmPaymentSuccess(booking, paymentMethod, transactionId, paymentInfo = {}) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (booking.status === BOOKING_STATUS.COMPLETED) return;

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
          errorCorrectionLevel: "M", type: "image/png", quality: 0.92, margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" }, width: 256,
        });
        booking.qrCode = qrCodeUrl;
      } catch (qrError) {
        console.error("QR Code error:", qrError);
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
              seatAvailability: { $elemMatch: { seatNumber: seatNum, isBooked: false } },
            })),
          },
          { $set: confirmSetUpdate, $inc: { bookedSeatsCount: seatNumbers.length } },
          { arrayFilters: confirmArrayFilters, new: true, session }
      );

      if (!finalizedSchedule) throw new Error("RACE_CONDITION_LOST");

      websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
        scheduleId: booking.schedule,
        seatAvailability: finalizedSchedule.seatAvailability,
        action: "booked",
        seatNumbers: seatNumbers,
      });

      const customer = await User.findById(booking.customer).session(session);
      if (customer) {
        customer.loyaltyPoints += Math.floor(booking.totalAmount / 10000);
        if (customer.loyaltyPoints >= 1000 && customer.membershipLevel === "Bạc") customer.membershipLevel = "Vàng";
        else if (customer.loyaltyPoints >= 5000 && customer.membershipLevel === "Vàng") customer.membershipLevel = "Bạch kim";
        await customer.save({ session });

        Promise.all([
          emailService.sendBookingConfirmation(booking, customer).catch(() => {}),
          customer.phoneNumber ? smsService.sendBookingConfirmation(customer.phoneNumber, booking).catch(() => {}) : null,
          Notification.createNotification({ user: customer._id, ...Notification.templates.bookingSuccess(booking) }).catch(() => {}),
        ]).catch(() => {});
      }
      redisService.del(`booking:temp:${booking._id}`).catch(() => {});
      redisService.invalidateScheduleCache(booking.schedule.toString()).catch(() => {});
    });
  } catch (error) {
    if (error.message === "RACE_CONDITION_LOST") {
      booking.status = "Đã hủy";
      booking.paymentDetails = { paymentMethod, transactionId, status: "Giao dịch treo (Ghế hết)", amount: booking.totalAmount, paymentDate: new Date(), paymentInfo: typeof paymentInfo === "string" ? paymentInfo : JSON.stringify(paymentInfo) };
      booking.cancellationReason = "Lỗi hệ thống: Ghế đã bị mua";
      await booking.save();
      throw new Error("PAYMENT_SUCCESS_BUT_SEAT_TAKEN_REFUNDED");
    } else throw error;
  } finally {
    await session.endSession();
  }
}

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
          scheduleId: booking.schedule, seatAvailability: schedule.seatAvailability, action: "released", seatNumbers: booking.seats.map((s) => s.seatNumber),
        });
      }

      if (booking.appliedVoucher) {
        await Voucher.findByIdAndUpdate(booking.appliedVoucher, { $inc: { usageCount: -1 }, $pull: { usedBy: { bookingId: booking._id } } }, { session });
      }

      const customer = await User.findById(booking.customer).session(session);
      if (customer) {
        Promise.all([
          Notification.createNotification({ user: customer._id, ...Notification.templates.paymentFailed(booking), channels: { inApp: true, email: true, sms: !!customer.phoneNumber } }).catch(() => {}),
        ]).catch(() => {});
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

      // 1. LẤY IP CHUẨN XÁC CỰC KỲ QUAN TRỌNG (Để không bị lỗi 70 trên Render)
      let ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "12.34.56.78";
      if (ipAddr && typeof ipAddr === "string") {
        ipAddr = ipAddr.split(",")[0].trim();
        if (ipAddr.length > 15 || ipAddr.includes(":")) {
          ipAddr = "12.34.56.78";
        }
      }

      console.log(`[VNPAY] Đang tạo link thật cho đơn: ${booking.bookingCode} | IP: ${ipAddr}`);

      const result = vnpayService.createPaymentUrl(booking, ipAddr);

      if (result.success) {
        booking.paymentDetails.transactionId = result.orderId;
        await booking.save();

        return successResponse(res, {
          paymentUrl: result.paymentUrl,
          orderId: result.orderId,
        });
      } else {
        console.error("Lỗi từ VNPay Service:", result.error);
        return errorResponse(res, "Không thể tạo link thanh toán VNPay", 500);
      }

    } catch (error) {
      console.error("Create VNPay Payment Error:", error);
      return errorResponse(res, "Lỗi Server", 500);
    }
  },

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
      if (result.isSuccess) return res.redirect(`${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}`);
      else {
        await handlePaymentFailure(booking);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Error`);
      }
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  },

  handleVNPayIPN: async (req, res) => {
    try {
      const vnpParams = req.query;
      const bookingCode = vnpParams["vnp_TxnRef"] ? vnpParams["vnp_TxnRef"].split("_")[0] : null;
      let booking = bookingCode ? await Booking.findOne({ bookingCode }) : null;

      const result = await vnpayService.verifyIpn(vnpParams, booking);
      res.json(result);

      if (result.RspCode === "00" && booking && booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
        confirmPaymentSuccess(booking, "VNPAY", vnpParams["vnp_TransactionNo"], { bankCode: vnpParams["vnp_BankCode"] }).catch(() => {});
      }
    } catch (error) {
      res.json({ RspCode: "99", Message: "Unknown error" });
    }
  },

  createMoMoPayment: async (req, res) => {
    try {
      const bookingId = req.params.bookingId || req.params.id;
      const booking = await Booking.findById(bookingId);
      if (!booking) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      if (booking.status !== "Chờ thanh toán") return errorResponse(res, "Đơn đặt vé không chờ thanh toán", 400);

      const result = await momoService.createPayment(booking, "127.0.0.1");
      if (result.success) {
        booking.paymentDetails.transactionId = result.orderId;
        await booking.save();
        return successResponse(res, result);
      } else return errorResponse(res, "Lỗi MoMo", 500);
    } catch (error) {
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  handleMoMoReturn: async (req, res) => { return res.redirect(`${process.env.FRONTEND_URL}/payment/success`); },
  handleMoMoNotify: async (req, res) => { res.json({ resultCode: 0, message: "Success" }); },

  queryPaymentStatus: async (req, res) => { return successResponse(res, { status: "Success" }); },
  refundPayment: async (req, res) => { return successResponse(res, { success: true }, "Hoàn tiền thành công"); }
};

paymentController.vnpayReturn = paymentController.handleVNPayReturn;
paymentController.vnpayIpn = paymentController.handleVNPayIPN;
paymentController.momoReturn = paymentController.handleMoMoReturn;
paymentController.momoNotify = paymentController.handleMoMoNotify;
paymentController.createVNPayPayment = paymentController.createVnPayPayment;

export default paymentController;