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
import PointTransaction from "../models/point-transaction.model.js";
import emailService from "../services/email.service.js";
import momoService from "../services/payment/momo.service.js";
import vnpayService from "../services/payment/vnpay.service.js";
import redisService from "../services/redis.service.js";
import smsService from "../services/sms.service.js";
import websocketService from "../services/websocket.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

/**
 *  #1-4, #9-10: Helper function để confirm payment
 * Tập trung logic confirm payment để tránh duplicate code
 */
async function confirmPaymentSuccess(booking, paymentMethod, transactionId, paymentInfo = {}) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      //  #3: Check double confirmation
      if (booking.status === BOOKING_STATUS.COMPLETED) {
        // Đã được confirm rồi, return success
        return;
      }

      // Update booking status
      booking.status = BOOKING_STATUS.COMPLETED;
      booking.paymentDetails = {
        paymentMethod,
        transactionId,
        status: "Thành công",
        amount: booking.totalAmount,
        paymentDate: new Date(),
        paymentInfo: typeof paymentInfo === "string" ? paymentInfo : JSON.stringify(paymentInfo),
      };

      //  #9: Generate QR code
      try {
        const qrData = booking.bookingCode;

        const qrCodeUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: "M",
          type: "image/png",
          quality: 0.92,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
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
              $elemMatch: {
                seatNumber: seatNum,
                isBooked: false, //  CRITICAL: Phải chưa ai mua
              },
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
         // Race condition loser!
         throw new Error("RACE_CONDITION_LOST");
      }

      // Broadcast qua WebSocket
      websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
          scheduleId: booking.schedule,
          seatAvailability: finalizedSchedule.seatAvailability,
          action: "booked",
          seatNumbers: seatNumbers,
      });

      //  #10: Cộng loyalty points cho customer
      const customer = await User.findById(booking.customer).session(session);
      if (customer) {
        const pointsEarned = Math.floor(booking.totalAmount / 10000); // 1 điểm / 10k
        customer.loyaltyPoints += pointsEarned;

        // Tự động nâng hạng membership
        const oldLevel = customer.membershipLevel;
        if (customer.loyaltyPoints >= 1000 && customer.membershipLevel === "Bạc") {
          customer.membershipLevel = "Vàng";
        } else if (customer.loyaltyPoints >= 5000 && customer.membershipLevel === "Vàng") {
          customer.membershipLevel = "Kim Cương";
        }

        await customer.save({ session });

        // Ghi log PointTransaction
        try {
          if (pointsEarned > 0) {
            await PointTransaction.recordTransaction({
              userId: customer._id,
              type: "earn",
              points: pointsEarned,
              currentBalance: customer.loyaltyPoints,
              description: `Tích điểm từ vé ${booking.bookingCode} - ${booking.movieTitle}`,
              bookingId: booking._id,
              metadata: { movieTitle: booking.movieTitle, totalAmount: booking.totalAmount },
            });
          }
          if (booking.pointsUsed > 0) {
            await PointTransaction.recordTransaction({
              userId: customer._id,
              type: "redeem",
              points: -booking.pointsUsed,
              currentBalance: customer.loyaltyPoints,
              description: `Đổi điểm giảm ${booking.pointsDiscount?.toLocaleString("vi-VN")}đ cho vé ${booking.bookingCode}`,
              bookingId: booking._id,
              metadata: { pointsDiscount: booking.pointsDiscount },
            });
          }
          // Lưu pointsEarned
          booking.pointsEarned = pointsEarned;
          await booking.save({ session });
        } catch (ptErr) {
          console.error("PointTransaction log error:", ptErr);
        }

        // Send notifications (không chờ, không block transaction)
        Promise.all([
          emailService.sendBookingConfirmation(booking, customer).catch((err) => console.error("Email error:", err)),
          customer.phoneNumber
            ? smsService
                .sendBookingConfirmation(customer.phoneNumber, booking)
                .catch((err) => console.error("SMS error:", err))
            : null,
          Notification.createNotification({
            user: customer._id,
            ...Notification.templates.bookingSuccess(booking),
          }).catch((err) => console.error("Notification error:", err)),
        ]).catch((err) => console.error("Notification error:", err));

        // Notification nếu nâng hạng
        if (oldLevel !== customer.membershipLevel) {
          Notification.createNotification({
            user: customer._id,
            ...Notification.templates.membershipUpgrade(customer.membershipLevel),
          }).catch((err) => console.error("Membership upgrade notification error:", err));
        }
      }

      // Xóa cache
      redisService.del(`booking:temp:${booking._id}`).catch(() => {});
      redisService.invalidateScheduleCache(booking.schedule.toString()).catch(() => {});
    });
  } catch (error) {
    if (error.message === "RACE_CONDITION_LOST") {
      console.error(`Race condition detected for booking ${booking._id}. Initiating refund marking.`);

      // Update booking status to indicate refund needed
      // Use a new session or no session since previous one aborted
      booking.status = "Đã hủy";
      booking.paymentDetails = {
        paymentMethod,
        transactionId,
        status: "Giao dịch treo (Ghế hết)", // Custom status to alert Admin
        amount: booking.totalAmount,
        paymentDate: new Date(),
        paymentInfo: typeof paymentInfo === "string" ? paymentInfo : JSON.stringify(paymentInfo),
      };
      // Mark as cancelled by system
      booking.cancellationReason = "Lỗi hệ thống: Ghế đã bị người khác mua ngay lúc thanh toán";

      // AUTO-REFUND LOGIC
      try {
        let refundResult;
        console.log(`Auto-refunding for booking ${booking._id} (${paymentMethod})...`);

        if (paymentMethod === "VNPAY") {
           // VNPay requires transactionNo (passed in paymentInfo or separately?)
           // In confirmPaymentSuccess args: transactionId is usually the OrderId or TransId depending on gateway
           // For VNPay, transactionId param passed here is vnp_TransactionNo
           // paymentInfo has payDate which is needed
           refundResult = await vnpayService.refundTransaction(
             transactionId,
             booking.totalAmount,
             paymentInfo.payDate || moment().format("YYYYMMDDHHmmss"),
             "SYSTEM_AUTO_REFUND"
           );
        } else if (paymentMethod === "MoMo") {
           // MoMo requires orderId, transId, amount
           // transactionId passed here is transId
           refundResult = await momoService.refundTransaction(
             booking.paymentDetails.transactionId,
             transactionId,
             booking.totalAmount,
             "Hoàn tiền do hết ghế (Auto Refund)"
           );
        }

        if (refundResult && refundResult.success) {
           booking.paymentDetails.status = "Đã hoàn tiền (Auto)";
           booking.refundAmount = booking.totalAmount; // Update refund amount field
           console.log("Auto-refund successful");
        } else {
           console.error("Auto-refund failed", refundResult);
           booking.paymentDetails.status = "Hoàn tiền lỗi (Cần thủ công)";
        }
      } catch (refundError) {
        console.error("Auto-refund exception:", refundError);
        booking.paymentDetails.status = "Hoàn tiền lỗi (Cần thủ công)";
      }

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
 *  #4: Helper function để release seats khi payment fail
 *  CRITICAL: Thêm rollback voucher và product
 */
async function handlePaymentFailure(booking) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Check nếu đã được cancel rồi
      if (booking.status === BOOKING_STATUS.CANCELLED) {
        return;
      }

      booking.status = BOOKING_STATUS.CANCELLED;
      if (booking.paymentDetails) {
        booking.paymentDetails.status = "Thất bại";
      }
      await booking.save({ session });

      // Release seats trong schedule
      const schedule = await Schedule.findById(booking.schedule).session(session);
      if (schedule) {
        await schedule.releaseSeats(
          booking.seats.map((s) => s.seatNumber),
          session
        );

        // Broadcast qua WebSocket
        websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
          scheduleId: booking.schedule,
          seatAvailability: schedule.seatAvailability,
          action: "released",
          seatNumbers: booking.seats.map((s) => s.seatNumber),
        });
      }

      //  CRITICAL: Rollback voucher usage và remove from usedBy array
      if (booking.appliedVoucher) {
        await Voucher.findByIdAndUpdate(
          booking.appliedVoucher,
          {
            $inc: { usageCount: -1 },
            $pull: {
              usedBy: {
                bookingId: booking._id,
              },
            },
          },
          { session }
        );
      }

      //  CRITICAL: Restore product stock khi payment fail
      if (booking.products && booking.products.length > 0) {
        for (const item of booking.products) {
          let retries = 3;
          let restored = false;

          while (retries > 0 && !restored) {
            try {
              const product = await Product.findById(item.product).session(session);

              if (product) {
                const currentVersion = product.__v;

                const updated = await Product.findOneAndUpdate(
                  {
                    _id: item.product,
                    __v: currentVersion,
                  },
                  {
                    $inc: {
                      stockQuantity: item.quantity,
                      totalSold: -item.quantity,
                      __v: 1,
                    },
                    $set: { inStock: true },
                  },
                  {
                    session,
                    new: true,
                  }
                );

                if (updated) {
                  restored = true;
                } else {
                  retries--;
                  if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                  }
                }
              } else {
                restored = true; // Product deleted, skip
              }
            } catch (error) {
              console.error(`Error restoring product ${item.product}:`, error);
              retries--;
            }
          }

          if (!restored) {
            console.warn(`Failed to restore product ${item.product} after 3 retries`);
          }
        }
      }

      // : Gửi notification cho customer về payment failure
      const customer = await User.findById(booking.customer).session(session);
      if (customer) {
        // Send notification (không block transaction)
        Promise.all([
          Notification.createNotification({
            user: customer._id,
            ...Notification.templates.paymentFailed(booking),
            channels: {
              inApp: true,
              email: true,
              sms: !!customer.phoneNumber,
            },
          }).catch((err) => console.error("Payment failure notification error:", err)),
          customer.phoneNumber
            ? smsService.sendPaymentNotification(customer.phoneNumber, booking, "failed").catch(() => {})
            : null,
        ]).catch((err) => console.error("Payment failure notification error:", err));
      }

      // Xóa cache
      redisService.del(`booking:temp:${booking._id}`).catch(() => {});
      redisService.invalidateScheduleCache(booking.schedule.toString()).catch(() => {});
    });
  } finally {
    await session.endSession();
  }
}

const paymentController = {
  // VNPAY
  createVNPayPayment: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      }

      // Verify ownership
      if (booking.customer.toString() !== req.userId) {
        return errorResponse(res, "Bạn không có quyền thanh toán đơn này", 403);
      }

      if (booking.status !== "Chờ thanh toán") {
        return errorResponse(res, "Đơn đặt vé không ở trạng thái chờ thanh toán", 400);
      }

      // Check if payment is already in progress or completed
      if (booking.paymentDetails.status === "Thành công") {
        return errorResponse(res, "Đơn đặt vé đã được thanh toán", 400);
      }

      // Check if payment URL was already created recently (prevent spam)
      if (booking.paymentDetails.transactionId && booking.updatedAt > new Date(Date.now() - 5 * 60 * 1000)) {
        return errorResponse(res, "Vui lòng đợi 5 phút trước khi tạo link thanh toán mới", 429);
      }

      //  RACE CONDITION CHECK: Kiểm tra lại ghế trước khi tạo link
      const schedule = await Schedule.findById(booking.schedule);
      if (!schedule) {
         return errorResponse(res, "Suất chiếu không tồn tại", 400);
      }

      const unavailableSeats = booking.seats.filter(bookingSeat => {
         const scheduleSeat = schedule.seatAvailability.find(s => s.seatNumber === bookingSeat.seatNumber);
         return !scheduleSeat || scheduleSeat.isBooked; // Ghế không tìm thấy hoặc đã BỊ MUA
      });

      if (unavailableSeats.length > 0) {
         return errorResponse(res, `Ghế ${unavailableSeats.map(s => s.seatNumber).join(", ")} đã bị người khác mua. Vui lòng hủy đơn và chọn ghế khác.`, 409);
      }

      // Create payment URL
      const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress;

      const result = vnpayService.createPaymentUrl(booking, ipAddr);

      if (result.success) {
        // Update booking với orderId
        booking.paymentDetails.transactionId = result.orderId;
        await booking.save();

        return successResponse(res, {
          paymentUrl: result.paymentUrl,
          orderId: result.orderId,
        });
      } else {
        return errorResponse(res, "Không thể tạo payment URL", 500);
      }
    } catch (error) {
      console.error("Create VNPay payment error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // VNPay return URL
  handleVNPayReturn: async (req, res) => {
    try {
      const vnpParams = req.query;

      // Verify signature
      const result = vnpayService.verifyReturnUrl(vnpParams);

      if (!result.verified) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);
      }

      // Extract booking code from orderId
      const bookingCode = result.orderId.split("_")[0];
      const booking = await Booking.findOne({ bookingCode }).populate('schedule');

      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Booking not found`);
      }

      // : Verify amount matches
      if (Math.abs(booking.totalAmount - result.amount) >= 1) {
        console.error(`VNPay return amount mismatch: expected ${booking.totalAmount}, got ${result.amount}`);
        await handlePaymentFailure(booking);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Amount mismatch`);
      }

      if (result.isSuccess) {
        //  #1-4, #9-10: Sử dụng helper function
        await confirmPaymentSuccess(booking, "VNPAY", result.transactionNo, {
          bankCode: result.bankCode,
          payDate: result.payDate,
        });

        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}`);
      } else {
        //  #4: Release seats khi payment fail
        await handlePaymentFailure(booking);

        const message = vnpayService.getResponseMessage(result.responseCode);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      console.error("VNPay return handler error:", error);
      if (error.message === "PAYMENT_SUCCESS_BUT_SEAT_TAKEN_REFUNDED") {
         return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent("Ghế đã hết. Hệ thống đang hoàn tiền tự động.")}`);
      }
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  },

  // VNPay IPN (Instant Payment Notification)
  handleVNPayIPN: async (req, res) => {
    try {
      const vnpParams = req.query;
      const orderId = vnpParams["vnp_TxnRef"];
      const bookingCode = orderId ? orderId.split("_")[0] : null;

      // : Load booking first to verify orderId and amount
      let booking = null;
      if (bookingCode) {
        booking = await Booking.findOne({ bookingCode }).populate('schedule');
      }

      // : Verify with booking data to check orderId and amount
      const result = await vnpayService.verifyIpn(vnpParams, booking);

      // Return response to VNPay ngay để tránh timeout
      res.json(result);

      // Process payment in background
      if (result.RspCode === "00" && booking && booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
        // Sử dụng helper function giống return handler
        confirmPaymentSuccess(booking, "VNPAY", vnpParams["vnp_TransactionNo"], {
          bankCode: vnpParams["vnp_BankCode"],
          payDate: vnpParams["vnp_PayDate"],
        }).catch((err) => console.error("VNPay IPN processing error:", err));
      }
    } catch (error) {
      console.error("VNPay IPN error:", error);
      res.json({
        RspCode: "99",
        Message: "Unknown error",
      });
    }
  },

  // MOMO
  createMoMoPayment: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      }

      // Verify ownership
      if (booking.customer.toString() !== req.userId) {
        return errorResponse(res, "Bạn không có quyền thanh toán đơn này", 403);
      }

      if (booking.status !== "Chờ thanh toán") {
        return errorResponse(res, "Đơn đặt vé không ở trạng thái chờ thanh toán", 400);
      }

      //  RACE CONDITION CHECK: Kiểm tra lại ghế trước khi tạo link
      const schedule = await Schedule.findById(booking.schedule);
      if (!schedule) {
         return errorResponse(res, "Suất chiếu không tồn tại", 400);
      }

      const unavailableSeats = booking.seats.filter(bookingSeat => {
         const scheduleSeat = schedule.seatAvailability.find(s => s.seatNumber === bookingSeat.seatNumber);
         return !scheduleSeat || scheduleSeat.isBooked; // Ghế không tìm thấy hoặc đã BỊ MUA
      });

      if (unavailableSeats.length > 0) {
         return errorResponse(res, `Ghế ${unavailableSeats.map(s => s.seatNumber).join(", ")} đã bị người khác mua. Vui lòng hủy đơn và chọn ghế khác.`, 409);
      }

      // Create payment
      const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await momoService.createPayment(booking, ipAddr);

      if (result.success) {
        // Update booking
        booking.paymentDetails.transactionId = result.orderId;
        await booking.save();

        return successResponse(res, {
          paymentUrl: result.paymentUrl,
          deeplink: result.deeplink, // For mobile app
          qrCodeUrl: result.qrCodeUrl, // For scan
          orderId: result.orderId,
          requestId: result.requestId,
        });
      } else {
        return errorResponse(res, "Không thể tạo payment MoMo", 500);
      }
    } catch (error) {
      console.error("Create MoMo payment error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // MoMo return URL
  handleMoMoReturn: async (req, res) => {
    try {
      const momoData = req.query;

      // Verify signature
      const result = momoService.verifySignature(momoData);

      if (!result.verified) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);
      }

      const bookingCode = result.orderId.split("_")[0];
      const booking = await Booking.findOne({ bookingCode }).populate('schedule');

      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Booking not found`);
      }

      if (result.isSuccess) {
        await confirmPaymentSuccess(booking, "MoMo", result.transId, {
          message: result.message,
          orderInfo: result.orderInfo,
        });

        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}`);
      } else {
        //  #4: Release seats khi payment fail
        await handlePaymentFailure(booking);

        const message = momoService.getResultMessage(result.resultCode);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      console.error("MoMo return handler error:", error);
      if (error.message === "PAYMENT_SUCCESS_BUT_SEAT_TAKEN_REFUNDED") {
         return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent("Ghế đã hết. Hệ thống đang hoàn tiền tự động.")}`);
      }
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  },

  // MoMo IPN (notify)
  handleMoMoNotify: async (req, res) => {
    try {
      const momoData = req.body;

      const result = momoService.verifySignature(momoData);

      if (result.verified) {
        // Return success to MoMo ngay để tránh timeout
        res.json({
          resultCode: 0,
          message: "Success",
        });

        //  #11: Process in background
        if (result.isSuccess) {
          const bookingCode = result.orderId.split("_")[0];
          const booking = await Booking.findOne({ bookingCode }).populate('schedule');

          if (booking && booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
            // Sử dụng helper function giống return handler
            confirmPaymentSuccess(booking, "MoMo", result.transId, {
              message: result.message,
              orderInfo: result.orderInfo,
            }).catch((err) => console.error("MoMo notify processing error:", err));
          }
        }
      } else {
        res.json({
          resultCode: 97,
          message: "Invalid signature",
        });
      }
    } catch (error) {
      console.error("MoMo notify error:", error);
      res.json({
        resultCode: 99,
        message: "Unknown error",
      });
    }
  },

  // ============================================
  // QUERY & REFUND
  // ============================================

  // Query payment status
  queryPaymentStatus: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      }

      // Query based on payment method
      let result;
      if (booking.paymentDetails.paymentMethod === "VNPAY") {
        result = await vnpayService.queryTransaction(
          booking.paymentDetails.transactionId,
          booking.paymentDetails.paymentDate
        );
      } else if (booking.paymentDetails.paymentMethod === "MoMo") {
        result = await momoService.queryTransaction(booking.paymentDetails.transactionId, booking.bookingCode);
      }

      return successResponse(res, result);
    } catch (error) {
      console.error("Query payment status error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Refund payment
  refundPayment: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      }

      if (booking.status !== "Đã hủy") {
        return errorResponse(res, "Chỉ có thể hoàn tiền cho vé đã hủy", 400);
      }

      // Refund based on payment method
      let result;
      if (booking.paymentDetails.paymentMethod === "VNPAY") {
        result = await vnpayService.refundTransaction(
          booking.paymentDetails.transactionId,
          booking.refundAmount,
          booking.paymentDetails.paymentDate,
          req.userId
        );
      } else if (booking.paymentDetails.paymentMethod === "MoMo") {
        result = await momoService.refundTransaction(
          booking.bookingCode,
          booking.paymentDetails.transactionId,
          booking.refundAmount,
          "Hoàn tiền hủy vé"
        );
      }

      if (result.success) {
        // Update booking
        booking.paymentDetails.status = "Đã hoàn tiền";
        await booking.save();

        return successResponse(res, result, "Hoàn tiền thành công");
      } else {
        return errorResponse(res, "Hoàn tiền thất bại", 500);
      }
    } catch (error) {
      console.error("Refund payment error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default paymentController;
