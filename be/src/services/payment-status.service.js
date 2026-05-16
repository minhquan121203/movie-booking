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
import emailService from "./email.service.js";
import momoService from "./payment/momo.service.js";
import vnpayService from "./payment/vnpay.service.js";
import redisService from "./redis.service.js";
import smsService from "./sms.service.js";
import websocketService from "./websocket.service.js";

class PaymentStatusService {
  constructor() {
    this.pollingInterval = 30000; // 30 seconds
    this.maxRetries = 10;
  }

  /**
   * Start polling payment status for pending bookings
   */
  startPolling() {
    setInterval(async () => {
      await this.checkPendingPayments();
    }, this.pollingInterval);

    console.log("🔄 Payment status polling started");
  }

  /**
   * Check all pending payments and update status
   */
  async checkPendingPayments() {
    try {
      //  FIX #7: Find bookings waiting for payment confirmation (chỉ pending)
      const pendingBookings = await Booking.find({
        status: BOOKING_STATUS.PENDING_PAYMENT, //  FIX #6: Chỉ check pending bookings
        "paymentDetails.transactionId": { $exists: true, $ne: null },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      }).limit(50); // Process 50 at a time để tránh overload

      for (const booking of pendingBookings) {
        await this.checkBookingPaymentStatus(booking);
        // Small delay giữa các bookings để tránh overload
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Check pending payments error:", error);
    }
  }

  /**
   * Check payment status for specific booking
   *  FIX #7: Thêm lock mechanism để tránh duplicate processing
   */
  async checkBookingPaymentStatus(booking) {
    //  FIX #7: Acquire lock để tránh 2 instances cùng process 1 booking
    const lockKey = `payment_check:${booking._id}`;
    const locked = await this.acquireLock(lockKey, 60); // 60s TTL

    if (!locked) {
      // Đang được process bởi instance khác
      console.log(`Payment check for booking ${booking._id} is already in progress`);
      return;
    }

    try {
      const { paymentMethod, transactionId } = booking.paymentDetails;
      let paymentStatus = null;

      if (paymentMethod === "VNPAY") {
        paymentStatus = await this.checkVNPayStatus(booking.bookingCode, transactionId);
      } else if (paymentMethod === "MoMo") {
        paymentStatus = await this.checkMoMoStatus(transactionId);
      }

      if (paymentStatus) {
        await this.updateBookingStatus(booking, paymentStatus);
      }
    } catch (error) {
      console.error(`Check payment status error for booking ${booking._id}:`, error);
    } finally {
      // Release lock
      await this.releaseLock(lockKey);
    }
  }

  /**
   *  FIX #7: Acquire Redis lock
   */
  async acquireLock(lockKey, ttlSeconds) {
    try {
      if (!redisService.isConnected) {
        // Nếu Redis không available, không dùng lock (fallback)
        return true;
      }

      const result = await redisService.client?.set(lockKey, "1", {
        EX: ttlSeconds,
        NX: true, // Only set if not exists
      });

      return result === "OK";
    } catch (error) {
      console.error("Acquire lock error:", error);
      // Fallback: return true để tiếp tục process nếu lock fail
      return true;
    }
  }

  /**
   *  FIX #7: Release Redis lock
   */
  async releaseLock(lockKey) {
    try {
      if (redisService.isConnected) {
        await redisService.client?.del(lockKey);
      }
    } catch (error) {
      console.error("Release lock error:", error);
    }
  }

  /**
   * Check VNPay payment status
   */
  async checkVNPayStatus(bookingCode, transactionId) {
    try {
      const result = await vnpayService.queryTransaction(bookingCode, transactionId);

      if (result.success) {
        return {
          success: result.data.vnp_TransactionStatus === "00",
          transactionId: result.data.vnp_TransactionNo,
          paymentDate: result.data.vnp_PayDate,
          bankCode: result.data.vnp_BankCode,
        };
      }
    } catch (error) {
      console.error("VNPay status check error:", error);
    }

    return null;
  }

  /**
   * Check MoMo payment status
   */
  async checkMoMoStatus(transactionId) {
    try {
      const result = await momoService.queryTransaction(transactionId);

      if (result.success && result.data) {
        const code = Number(result.data.resultCode);

        if (code === 0) {
          return {
            success: true,
            transactionId: result.data.transId || transactionId,
            paymentDate: new Date(),
            orderInfo: result.data.orderInfo || "Thanh toan MoMo",
          };
        } else if (code === 1000 || code === 9000 || code === 8000) {
          console.log(`[MoMo] Đơn ${transactionId} đang chờ khách quét mã... (Code: ${code})`);
          return null;
        } else {
          console.log(`[MoMo] Đơn ${transactionId} đã bị khách hủy hoặc thất bại! (Code: ${code})`);
          return { success: false };
        }
      }
    } catch (error) {
      console.error("MoMo status check error:", error);
    }

    return null; // Lỗi mạng thì im lặng chờ lần sau check tiếp
  }

  /**
   * Update booking status based on payment result
   *  FIX #6: Sử dụng atomic update để tránh race condition
   */
  async updateBookingStatus(booking, paymentStatus) {
    try {
      if (paymentStatus.success) {
        //  FIX #6: Atomic update - chỉ update nếu còn pending
        const updatedBooking = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            status: BOOKING_STATUS.PENDING_PAYMENT, // Chỉ update nếu còn pending
          },
          {
            $set: {
              status: BOOKING_STATUS.COMPLETED,
              "paymentDetails.status": "Thành công",
              "paymentDetails.paymentDate": paymentStatus.paymentDate,
              "paymentDetails.paymentInfo": JSON.stringify(paymentStatus),
            },
          },
          { new: true }
        );

        if (!updatedBooking) {
          // Đã được confirm bởi service khác
          console.log(`Booking ${booking._id} already confirmed by another service`);
          return;
        }

        booking = updatedBooking;

        //  FIX #1, #9, #10: Wrap trong transaction và confirm seats, generate QR, loyalty points
        const session = await mongoose.startSession();

        try {
          await session.withTransaction(async () => {
            // Reload booking với session để đảm bảo có data mới nhất
            const bookingWithSession = await Booking.findById(booking._id).session(session);
            if (!bookingWithSession) {
              throw new Error("Booking not found");
            }

            booking = bookingWithSession;

            //  FIX #9: Generate QR code nếu chưa có
            if (!booking.qrCode) {
              try {
                // const qrData = JSON.stringify({
                //   bookingId: booking._id.toString(),
                //   bookingCode: booking.bookingCode,
                //   movieTitle: booking.movieTitle,
                //   theaterName: booking.theaterName,
                //   roomName: booking.roomName,
                //   showDate: booking.showDate.toISOString().split("T")[0],
                //   showTime: booking.showTime,
                //   seats: booking.seats.map((s) => s.seatNumber).join(", "),
                //   totalAmount: booking.totalAmount,
                //   timestamp: new Date().toISOString(),
                // });

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
                await booking.save({ session });
              } catch (qrError) {
                console.error("QR Code generation error:", qrError);
              }
            }

            //  FIX #1: Confirm seats trong schedule
            const schedule = await Schedule.findById(booking.schedule).session(session);
            if (schedule) {
              await schedule.confirmSeats(
                booking.seats.map((s) => s.seatNumber),
                booking._id,
                session
              );

              // Broadcast qua WebSocket
              websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
                scheduleId: booking.schedule,
                seatAvailability: schedule.seatAvailability,
                action: "booked",
                seatNumbers: booking.seats.map((s) => s.seatNumber),
              });
            }

            //  FIX #10: Cộng loyalty points cho customer
            const customer = await User.findById(booking.customer).session(session);
            if (customer) {
              const pointsEarned = Math.floor(booking.totalAmount / 10000); // 1 điểm / 10k
              customer.loyaltyPoints += pointsEarned;

              // Tự động nâng hạng membership
              const oldLevel = customer.membershipLevel;
              if (customer.loyaltyPoints >= 500 && customer.membershipLevel === "Bạc") {
                customer.membershipLevel = "Vàng";
              } else if (customer.loyaltyPoints >= 1125 && customer.membershipLevel === "Vàng") {
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
                booking.pointsEarned = pointsEarned;
                await booking.save({ session });
              } catch (ptErr) {
                console.error("PointTransaction log error (polling):", ptErr);
              }

              // Send notifications (không chờ, không block transaction)
              Promise.all([
                emailService
                  .sendBookingConfirmation(booking, customer)
                  .catch((err) => console.error("Email error:", err)),
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
        } finally {
          await session.endSession();
        }

        console.log(` Payment confirmed for booking ${booking.bookingCode}`);
      } else {
        // Payment failed - release seats
        await this.handleFailedPayment(booking);
      }
    } catch (error) {
      console.error("Update booking status error:", error);
    }
  }

  /**
   * Handle failed payment
   *  FIX CRITICAL: Thêm rollback voucher và product
   */
  async handleFailedPayment(booking) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        booking.status = "Đã hủy";
        booking.paymentDetails.status = "Thất bại";
        await booking.save({ session });

        // Release seats
        const schedule = await Schedule.findById(booking.schedule).session(session);
        if (schedule) {
          await schedule.releaseSeats(
            booking.seats.map((s) => s.seatNumber),
            session
          );
        }

        //  FIX CRITICAL: Rollback voucher usage và remove from usedBy array
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

        //  FIX CRITICAL: Restore product stock khi payment fail
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

        console.log(` Payment failed for booking ${booking.bookingCode}`);
      });
    } catch (error) {
      console.error("Handle failed payment error:", error);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Manual payment status check for specific booking
   */
  async manualStatusCheck(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      await this.checkBookingPaymentStatus(booking);
      return { success: true, message: "Payment status checked" };
    } catch (error) {
      console.error("Manual status check error:", error);
      return { success: false, error: error.message };
    }
  }
}

const paymentStatusService = new PaymentStatusService();

export default paymentStatusService;
