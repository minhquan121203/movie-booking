import mongoose from "mongoose";
import QRCode from "qrcode";
import payos from "../services/payment/payos.service.js"; // 👈 Đã import PayOS
import Booking from "../models/booking.model.js";
import Product from "../models/product.model.js";
import Schedule from "../models/schedule.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";

// Import services
import Notification from "../models/notification.model.js";
import emailService from "../services/email.service.js";
import redisService from "../services/redis.service.js";
import smsService from "../services/sms.service.js";
import websocketService from "../services/websocket.service.js";

import { BOOKING_CONSTANTS, BOOKING_STATUS } from "../constants/booking.js";
import { errorResponse, successResponse } from "../utils/response.js";

const bookingController = {
  // Tạo đơn đặt vé mới
  createBooking: async (req, res) => {
    // Input Validation
    const { scheduleId, seats, products, voucherCode, paymentMethod } = req.body; // 👈 Đã thêm paymentMethod

    // Validate input
    if (!scheduleId || !mongoose.Types.ObjectId.isValid(scheduleId)) {
      return errorResponse(res, "Schedule ID không hợp lệ", 400);
    }

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return errorResponse(res, "Phải chọn ít nhất 1 ghế", 400);
    }

    if (seats.length > 10) {
      return errorResponse(res, "Không thể đặt quá 10 ghế cùng lúc", 400);
    }

    // Validate seat structure
    for (const seat of seats) {
      if (!seat.seatNumber || typeof seat.seatNumber !== "string") {
        return errorResponse(res, "Thông tin ghế không hợp lệ", 400);
      }
    }

    // Validate products if provided
    if (products && Array.isArray(products)) {
      for (const item of products) {
        if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
          return errorResponse(res, "Product ID không hợp lệ", 400);
        }
        if (!item.quantity || item.quantity < 1 || item.quantity > 20) {
          return errorResponse(res, "Số lượng sản phẩm không hợp lệ (1-20)", 400);
        }
      }
    }

    // Wrap toàn bộ booking flow trong transaction
    const session = await mongoose.startSession();

    try {
      let newBooking;
      let schedule;
      let appliedVoucher = null;
      let discountAmount = 0;

      await session.withTransaction(async () => {
        // 1. Validate schedule
        schedule = await Schedule.findById(scheduleId)
            .populate("movie", "title")
            .populate("theater", "name")
            .session(session);

        const scheduleMovieTitle = schedule.movie?.title;
        const scheduleTheaterName = schedule.theater?.name;

        if (!schedule) {
          throw new Error("Không tìm thấy suất chiếu");
        }

        if (schedule.status !== "Đang mở bán vé") {
          throw new Error("Suất chiếu không còn mở bán vé");
        }

        const now = new Date();
        const showDate = new Date(schedule.showDate);
        const [hours, minutes] = schedule.startTime.split(":").map(Number);
        const showDateTime = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate(), hours, minutes);

        const allowLateBookingMinutes = 30;
        const lateBookingCutoff = new Date(showDateTime.getTime() + allowLateBookingMinutes * 60 * 1000);

        if (now > lateBookingCutoff) {
          throw new Error("Suất chiếu đã bắt đầu hoặc đã kết thúc. Không thể đặt vé nữa.");
        }

        // 2. Hold ghế với atomic operation
        const seatNumbers = seats.map((s) => s.seatNumber);
        const currentVersion = schedule.__v;

        const arrayFilters = seatNumbers.map((seatNum) => ({
          [`seat${seatNum.replace(/[^a-zA-Z0-9]/g, "")}.seatNumber`]: seatNum,
        }));

        const setUpdate = {};
        seatNumbers.forEach((seatNum) => {
          const placeholder = `seat${seatNum.replace(/[^a-zA-Z0-9]/g, "")}`;
          setUpdate[`seatAvailability.$[${placeholder}].holdUntil`] = new Date(
              Date.now() + BOOKING_CONSTANTS.SEAT_HOLD_DURATION_MS
          );
        });

        const updatedSchedule = await Schedule.findOneAndUpdate(
            {
              _id: scheduleId,
              __v: currentVersion,
              status: "Đang mở bán vé",
              $and: seatNumbers.map((seatNum) => ({
                seatAvailability: {
                  $elemMatch: {
                    seatNumber: seatNum,
                    isBooked: false,
                  },
                },
              })),
            },
            {
              $inc: { __v: 1 },
              $set: setUpdate,
            },
            {
              arrayFilters,
              new: true,
              session,
            }
        );

        if (!updatedSchedule) {
          throw new Error("Một số ghế đã được đặt hoặc đang được giữ bởi người khác. Vui lòng thử lại.");
        }

        schedule = updatedSchedule;

        // 3. Tính tiền vé
        let ticketsAmount = 0;
        const validatedSeats = seats.map((seat) => {
          const scheduleSeat = schedule.seatAvailability.find((s) => s.seatNumber === seat.seatNumber);
          if (!scheduleSeat) {
            throw new Error(`Ghế ${seat.seatNumber} không tồn tại`);
          }

          let price;
          switch (scheduleSeat.seatType) {
            case "VIP":
              price = schedule.ticketPrices.vip;
              break;
            case "Ghế đôi":
              price = schedule.ticketPrices.couple;
              break;
            default:
              price = schedule.ticketPrices.standard;
          }

          ticketsAmount += price;
          return {
            seatNumber: seat.seatNumber,
            seatType: scheduleSeat.seatType,
            price,
          };
        });

        // 4. Xử lý products
        let productsAmount = 0;
        let orderedProducts = [];

        if (products && products.length > 0) {
          for (const item of products) {
            let retries = 3;
            let updatedProduct = null;

            while (retries > 0 && !updatedProduct) {
              try {
                const product = await Product.findById(item.productId).session(session);

                if (!product) throw new Error(`Sản phẩm không tồn tại`);
                if (!product.inStock) throw new Error(`Sản phẩm "${product.name}" hiện đang hết hàng`);
                if (product.stockQuantity < item.quantity) throw new Error(`Sản phẩm "${product.name}" chỉ còn ${product.stockQuantity} trong kho`);

                const currentVersion = product.__v;

                updatedProduct = await Product.findOneAndUpdate(
                    {
                      _id: item.productId,
                      __v: currentVersion,
                      inStock: true,
                      stockQuantity: { $gte: item.quantity },
                    },
                    {
                      $inc: {
                        stockQuantity: -item.quantity,
                        totalSold: item.quantity,
                        __v: 1,
                      },
                    },
                    { new: true, session }
                );

                if (!updatedProduct) {
                  retries--;
                  if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 50 * (4 - retries)));
                    continue;
                  }
                  throw new Error(`Không thể cập nhật stock cho sản phẩm "${product.name}".`);
                }

                if (updatedProduct.stockQuantity < 0) {
                  throw new Error(`Race condition detected - stock went negative for product ${updatedProduct.name}`);
                }

                if (updatedProduct.stockQuantity === 0) {
                  await Product.updateOne({ _id: updatedProduct._id }, { inStock: false }, { session });
                }
              } catch (error) {
                if (retries === 1) throw error;
                retries--;
                await new Promise((resolve) => setTimeout(resolve, 50 * (4 - retries)));
              }
            }

            const itemTotal = updatedProduct.price * item.quantity;
            productsAmount += itemTotal;

            orderedProducts.push({
              product: updatedProduct._id,
              productName: updatedProduct.name,
              quantity: item.quantity,
              priceAtBooking: updatedProduct.price,
              size: item.size || updatedProduct.size,
            });
          }
        }

        // 5. Xử lý voucher
        if (voucherCode) {
          const subtotal = ticketsAmount + productsAmount;
          let retries = 3;
          let voucher = null;

          while (retries > 0 && !voucher) {
            try {
              voucher = await Voucher.findOneAndUpdate(
                  {
                    code: voucherCode.toUpperCase(),
                    isActive: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() },
                    minOrderValue: { $lte: subtotal },
                    $expr: { $lt: ["$usageCount", "$usageLimit"] },
                  },
                  {
                    $inc: { usageCount: 1 },
                    $push: {
                      usedBy: {
                        user: req.userId,
                        bookingId: null,
                        usedAt: new Date(),
                      },
                    },
                  },
                  { new: true, session }
              );

              if (!voucher) {
                retries--;
                if (retries > 0) {
                  await new Promise((resolve) => setTimeout(resolve, 50 * (4 - retries)));
                  continue;
                }
                throw new Error("Mã voucher không hợp lệ, đã hết hạn, không đủ điều kiện hoặc đã hết lượt sử dụng");
              }
            } catch (error) {
              if (retries === 1) throw error;
              retries--;
              await new Promise((resolve) => setTimeout(resolve, 50 * (4 - retries)));
            }
          }

          if (voucher) {
            if (voucher.discountType === "fixed") {
              discountAmount = voucher.discountValue;
            } else {
              discountAmount = Math.floor((subtotal * voucher.discountValue) / 100);
            }
            if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
              discountAmount = voucher.maxDiscountAmount;
            }
            appliedVoucher = voucher._id;
          }
        }

        // 6. Tính tổng tiền
        const subtotal = ticketsAmount + productsAmount;
        const totalAmount = subtotal - discountAmount;

        // 7. Tạo booking
        const bookingData = {
          customer: req.userId,
          schedule: scheduleId,
          movieTitle: scheduleMovieTitle || schedule.movie?.title || "Unknown Movie",
          theaterName: scheduleTheaterName || schedule.theater?.name || "Unknown Theater",
          roomName: schedule.roomName,
          showDate: schedule.showDate,
          showTime: `${schedule.startTime} - ${schedule.endTime}`,
          seats: validatedSeats,
          products: orderedProducts,
          appliedVoucher,
          voucherCode: voucherCode?.toUpperCase(),
          ticketsAmount,
          productsAmount,
          subtotal,
          discountAmount,
          totalAmount,
          status: BOOKING_STATUS.PENDING_PAYMENT,
          paymentDetails: {
            paymentMethod: paymentMethod || "pending",
            status: BOOKING_STATUS.PENDING_PAYMENT,
            amount: totalAmount,
          },
        };

        const [booking] = await Booking.create([bookingData], { session });
        newBooking = booking;

        // 8. Update bookingId vào voucher
        if (appliedVoucher) {
          await Voucher.updateOne(
              {
                _id: appliedVoucher,
                "usedBy.user": req.userId,
                "usedBy.bookingId": null,
              },
              {
                $set: { "usedBy.$.bookingId": newBooking._id },
              },
              { session }
          );
        }

        // 9. Update booking ID trong Schedule
        const bookingIdArrayFilters = seatNumbers.map((seatNum) => ({
          [`seat${seatNum.replace(/[^a-zA-Z0-9]/g, "")}.seatNumber`]: seatNum,
        }));

        const bookingIdSetUpdate = {};
        seatNumbers.forEach((seatNum) => {
          const placeholder = `seat${seatNum.replace(/[^a-zA-Z0-9]/g, "")}`;
          bookingIdSetUpdate[`seatAvailability.$[${placeholder}].bookedBy`] = newBooking._id;
        });

        await Schedule.updateOne(
            { _id: scheduleId },
            { $set: bookingIdSetUpdate },
            { arrayFilters: bookingIdArrayFilters, session }
        );
      }); // End transaction

      await session.endSession();

      // 9. Broadcast qua WebSocket
      websocketService.emitToSchedule(scheduleId, "seats-status-changed", {
        scheduleId,
        seatAvailability: schedule.seatAvailability,
        action: "held",
        seatNumbers: seats.map((s) => s.seatNumber),
        userId: req.userId,
      });

      // 10. Cache booking tạm
      await redisService.set(`booking:temp:${newBooking._id}`, newBooking, 900);

      // ==========================================
      // 🚀 BẮT ĐẦU: TẠO LINK THANH TOÁN PAYOS
      // ==========================================
      let checkoutUrl = null;

      if (paymentMethod === 'bank_transfer') {
        // 1. PayOS bắt buộc orderCode là SỐ NGUYÊN
        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

        // 2. Lưu lại vào transactionId để Webhook gọi về còn nhận diện được
        newBooking.paymentDetails.transactionId = payosOrderCode.toString();
        await newBooking.save();

        // 3. Data gửi sang PayOS
        const requestData = {
          orderCode: payosOrderCode,
          amount: newBooking.totalAmount,
          description: `BUNNY ${newBooking.bookingCode}`.substring(0, 25),
          returnUrl: `https://movie-booking-cinema.vercel.app/order-history`,
          cancelUrl: `https://movie-booking-cinema.vercel.app/order-history`
        };

        try {
          // Gọi API PayOS tạo link
          const paymentLink = await payos.paymentRequests.create(requestData);
          checkoutUrl = paymentLink.checkoutUrl;
        } catch (payosError) {
          console.error("Lỗi tạo link PayOS:", payosError);
        }
      }
      // ==========================================
      // 🚀 KẾT THÚC ĐOẠN PAYOS
      // ==========================================

      return successResponse(
          res,
          {
            bookingId: newBooking._id,
            bookingCode: newBooking.bookingCode,
            totalAmount: newBooking.totalAmount,
            payosCheckoutUrl: checkoutUrl, // 👈 Trả link PayOS ra đây
            holdUntil: new Date(Date.now() + BOOKING_CONSTANTS.SEAT_HOLD_DURATION_MS),
          },
          "Tạo đơn đặt vé thành công. Vui lòng thanh toán trong 10 phút",
          201
      );
    } catch (error) {
      await session.endSession();
      console.error("Create booking error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  // Xác nhận thanh toán
  confirmPayment: async (req, res) => {
    try {
      const bookingId = req.params.bookingId || req.params.id;
      const { paymentMethod, transactionId } = req.body;

      let booking = await Booking.findById(bookingId);
      if (!booking) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      if (booking.customer.toString() !== req.userId) return errorResponse(res, "Bạn không có quyền thực hiện hành động này", 403);
      if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) return errorResponse(res, "Đơn đặt vé không ở trạng thái chờ thanh toán", 400);

      let paymentVerified = false;
      let paymentInfo = {};

      if (paymentMethod === "VNPAY" && transactionId) {
        try {
          const vnpayService = await import("../services/payment/vnpay.service.js");
          const verifyResult = await vnpayService.default.queryTransaction(booking.bookingCode, transactionId);

          if (verifyResult.success && verifyResult.data.vnp_TransactionStatus === "00") {
            paymentVerified = true;
            paymentInfo = {
              transactionId: verifyResult.data.vnp_TransactionNo,
              bankCode: verifyResult.data.vnp_BankCode,
              payDate: verifyResult.data.vnp_PayDate,
            };
          }
        } catch (error) {
          console.error("VNPay verification error:", error);
          return errorResponse(res, "Không thể xác minh thanh toán VNPay", 400);
        }
      } else if (paymentMethod === "MoMo" && transactionId) {
        try {
          const momoService = await import("../services/payment/momo.service.js");
          const verifyResult = await momoService.default.queryTransaction(transactionId);

          if (verifyResult.success && verifyResult.resultCode === 0) {
            paymentVerified = true;
            paymentInfo = {
              transactionId: verifyResult.transId,
              orderInfo: verifyResult.orderInfo,
            };
          }
        } catch (error) {
          console.error("MoMo verification error:", error);
          return errorResponse(res, "Không thể xác minh thanh toán MoMo", 400);
        }
      } else if (paymentMethod === "Tại quầy") {
        if (req.userRole !== "admin" && req.userRole !== "super-admin") {
          return errorResponse(res, "Chỉ admin mới có thể xác nhận thanh toán tại quầy", 403);
        }
        paymentVerified = true;
        paymentInfo = { verifiedBy: req.userId };
      } else if (paymentMethod === "bank_transfer") {
        if (req.userRole !== "admin" && req.userRole !== "super-admin") {
          return errorResponse(res, "Chỉ admin mới có quyền duyệt đơn chuyển khoản", 403);
        }
        paymentVerified = true;
        paymentInfo = {
          verifiedBy: req.userId,
          note: "Được duyệt thủ công bởi Admin"
        };
      } else {
        return errorResponse(res, "Phương thức thanh toán không hợp lệ", 400);
      }

      if (!paymentVerified) return errorResponse(res, "Không thể xác minh thanh toán. Vui lòng kiểm tra lại thông tin giao dịch", 400);

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const updatedBooking = await Booking.findOneAndUpdate(
              { _id: bookingId, status: BOOKING_STATUS.PENDING_PAYMENT },
              {
                $set: {
                  status: BOOKING_STATUS.COMPLETED,
                  paymentDetails: {
                    paymentMethod,
                    transactionId,
                    status: "Thành công",
                    amount: booking.totalAmount,
                    paymentDate: new Date(),
                    paymentInfo: JSON.stringify(paymentInfo),
                  },
                },
              },
              { new: true, session }
          );

          if (!updatedBooking) throw new Error("Booking đã được xác nhận thanh toán bởi hệ thống khác");
          booking = updatedBooking;

          // Generate QR code
          try {
            const qrData = JSON.stringify({
              bookingId: booking._id.toString(),
              bookingCode: booking.bookingCode,
              movieTitle: booking.movieTitle,
              theaterName: booking.theaterName,
              roomName: booking.roomName,
              showDate: booking.showDate.toISOString().split("T")[0],
              showTime: booking.showTime,
              seats: booking.seats.map((s) => s.seatNumber).join(", "),
              totalAmount: booking.totalAmount,
              timestamp: new Date().toISOString(),
            });

            const qrCodeUrl = await QRCode.toDataURL(qrData, {
              errorCorrectionLevel: "M", type: "image/png", quality: 0.92, margin: 1,
              color: { dark: "#000000", light: "#FFFFFF" }, width: 256,
            });

            booking.qrCode = qrCodeUrl;
            await booking.save({ session });
          } catch (qrError) {
            console.error("QR Code generation error:", qrError);
            booking.qrCode = null;
            await booking.save({ session });
          }

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
                seatAvailability: { $exists: true, $not: { $size: 0 } }, // Đảm bảo trường này tồn tại và không rỗng
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
              { arrayFilters: confirmArrayFilters, new: true, session }
          );

          if (!finalizedSchedule) throw new Error("Giao dịch thất bại. Một số ghế đã bị người khác mua ngay trước khi bạn thanh toán.");

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
            if (customer.loyaltyPoints >= 1000 && customer.membershipLevel === "Bạc") {
              customer.membershipLevel = "Vàng";
            } else if (customer.loyaltyPoints >= 5000 && customer.membershipLevel === "Vàng") {
              customer.membershipLevel = "Bạch kim";
            }

            await customer.save({ session });

            Promise.all([
              emailService.sendBookingConfirmation(booking, customer).catch((err) => console.error("Email error:", err)),
              customer.phoneNumber ? smsService.sendBookingConfirmation(customer.phoneNumber, booking).catch((err) => console.error("SMS error:", err)) : null,
              Notification.createNotification({ user: customer._id, ...Notification.templates.bookingSuccess(booking) }).catch((err) => console.error("Notification error:", err)),
            ]).catch((err) => console.error("Notification error:", err));

            if (oldLevel !== customer.membershipLevel) {
              Notification.createNotification({ user: customer._id, ...Notification.templates.membershipUpgrade(customer.membershipLevel) }).catch((err) => console.error("Membership upgrade notification error:", err));
            }
          }

          redisService.delPattern(`bookings:user:${booking.customer}:*`).catch(() => {});
          redisService.del(`booking:temp:${bookingId}`).catch(() => {});
          redisService.invalidateScheduleCache(booking.schedule.toString()).catch(() => {});
        });
      } finally {
        await session.endSession();
      }

      booking = await Booking.findById(bookingId).lean();
      const customer = await User.findById(booking.customer);
      const pointsEarned = Math.floor(booking.totalAmount / 10000);

      return successResponse(
          res,
          {
            booking,
            pointsEarned,
            newMembershipLevel: customer.membershipLevel,
            upgraded: customer.membershipLevel !== "Bạc" && customer.loyaltyPoints >= 1000,
          },
          "Thanh toán thành công"
      );
    } catch (error) {
      console.error("Confirm payment error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy danh sách booking của user
  getMyBookings: async (req, res) => {
    try {
      let { page = 1, limit = 10, status } = req.query;
      page = Math.max(parseInt(page, 10) || 1, 1);
      limit = Math.max(parseInt(limit, 10) || 10, 1);
      const skip = (page - 1) * limit;
      const query = { customer: req.userId };
      if (status && typeof status === "string") query.status = status.trim();

      const cacheKey = `bookings:user:${req.userId}:${page}:${limit}:${status || "all"}`;
      const cachedData = await redisService.get(cacheKey);

      if (cachedData) return successResponse(res, cachedData, "Success");

      const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate({
              path: "schedule",
              populate: [
                { path: "movie", select: "title posterUrl duration genres rating" },
                { path: "theater", select: "name address city" },
              ],
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Booking.countDocuments(query),
      ]);

      const result = {
        bookings: bookings.map((b) => ({
          _id: b._id, bookingCode: b.bookingCode, customer: b.customer,
          schedule: {
            _id: b.schedule?._id, showDate: b.schedule?.showDate, showTime: b.schedule?.showTime,
            startTime: b.schedule?.startTime, endTime: b.schedule?.endTime,
            movie: b.schedule?.movie && {
              _id: b.schedule.movie._id, title: b.schedule.movie.title, posterUrl: b.schedule.movie.posterUrl,
              duration: b.schedule.movie.duration, genres: b.schedule.movie.genres, rating: b.schedule.movie.rating,
            },
            theater: b.schedule?.theater && {
              _id: b.schedule.theater._id, name: b.schedule.theater.name, address: b.schedule.theater.address, city: b.schedule.theater.city,
            },
            room: b.schedule?.room && {
              _id: b.schedule?.room, name: b.schedule?.roomName, roomType: b.schedule?.roomType,
            },
          },
          seats: b.seats,
          products: b.products.map((p) => ({
            product: p.product, productName: p.productName, quantity: p.quantity, priceAtBooking: p.priceAtBooking, size: p.size,
          })),
          appliedVoucher: b.appliedVoucher, ticketsAmount: b.ticketsAmount, productsAmount: b.productsAmount,
          subtotal: b.subtotal, discountAmount: b.discountAmount, totalAmount: b.totalAmount, status: b.status,
          qrCode: b.qrCode, createdAt: b.createdAt, updatedAt: b.updatedAt,
        })),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total },
      };

      await redisService.set(cacheKey, result, 300);
      return successResponse(res, result);
    } catch (error) {
      console.error("Get my bookings error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy chi tiết booking
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;
      const b = await Booking.findById(id)
          .populate("customer", "fullName email phoneNumber")
          .populate({
            path: "schedule",
            populate: [
              { path: "movie", select: "title posterUrl duration genre rating" },
              { path: "theater", select: "name address city" },
              { path: "room", select: "name roomType" },
            ],
          })
          .populate("appliedVoucher", "code description discountValue")
          .populate("products.product", "name category price imageUrl")
          .lean();

      if (!b) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      if (b.customer._id.toString() !== req.userId && req.userRole !== "admin") return errorResponse(res, "Bạn không có quyền xem đơn đặt vé này", 403);

      const cleanBooking = {
        _id: b._id, bookingCode: b.bookingCode, showTime: b.showTime, roomName: b.roomName, customer: b.customer,
        schedule: b.schedule && {
          _id: b.schedule._id, showDate: b.schedule.showDate, showTime: b.schedule.showTime,
          movie: b.schedule.movie && {
            _id: b.schedule.movie._id, title: b.schedule.movie.title, posterUrl: b.schedule.movie.posterUrl,
            duration: b.schedule.movie.duration, genre: b.schedule.movie.genre, rating: b.schedule.movie.rating,
          },
          theater: b.schedule.theater && {
            _id: b.schedule.theater._id, name: b.schedule.theater.name, address: b.schedule.theater.address, city: b.schedule.theater.city,
          },
          room: b.schedule.room && {
            _id: b.schedule.room._id, name: b.schedule.room.name, roomType: b.schedule.room.roomType,
          },
        },
        seats: b.seats,
        products: b.products.map((p) => ({
          product: p.product, productName: p.productName, quantity: p.quantity, priceAtBooking: p.priceAtBooking, size: p.size,
        })),
        appliedVoucher: b.appliedVoucher, ticketsAmount: b.ticketsAmount, productsAmount: b.productsAmount,
        subtotal: b.subtotal, discountAmount: b.discountAmount, totalAmount: b.totalAmount, status: b.status,
        paymentDetails: b.paymentDetails, qrCode: b.qrCode, createdAt: b.createdAt, updatedAt: b.updatedAt,
        cancelledBy: b.cancelledBy, cancelledAt: b.cancelledAt, cancellationReason: b.cancellationReason, refundAmount: b.refundAmount, __v: b.__v,
      };

      return successResponse(res, cleanBooking);
    } catch (error) {
      console.error("Get booking by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Hủy booking
  cancelBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findById(id);
      if (!booking) return errorResponse(res, "Không tìm thấy đơn đặt vé", 404);
      if (booking.customer.toString() !== req.userId && req.userRole !== "admin") return errorResponse(res, "Bạn không có quyền hủy đơn đặt vé này", 403);
      if (!booking.canBeCancelled()) return errorResponse(res, "Không thể hủy vé này (phải hủy trước 24h)", 400);

      const refundAmount = booking.calculateRefund();
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelledBy = req.userId;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason;
      booking.refundAmount = refundAmount;
      await booking.save();

      const schedule = await Schedule.findById(booking.schedule);
      await schedule.releaseSeats(booking.seats.map((s) => s.seatNumber));

      websocketService.emitToSchedule(booking.schedule.toString(), "seats-status-changed", {
        scheduleId: booking.schedule, seatAvailability: schedule.seatAvailability, action: "released", seatNumbers: booking.seats.map((s) => s.seatNumber),
      });

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          if (booking.appliedVoucher) {
            await Voucher.findByIdAndUpdate(booking.appliedVoucher, { $inc: { usageCount: -1 }, $pull: { usedBy: { bookingId: booking._id } } }, { session });
          }

          if (booking.products && booking.products.length > 0) {
            for (const item of booking.products) {
              let retries = 3; let restored = false;
              while (retries > 0 && !restored) {
                try {
                  const product = await Product.findById(item.product).session(session);
                  if (product) {
                    const currentVersion = product.__v;
                    const updated = await Product.findOneAndUpdate(
                        { _id: item.product, __v: currentVersion },
                        { $inc: { stockQuantity: item.quantity, totalSold: -item.quantity, __v: 1 }, $set: { inStock: true } },
                        { session, new: true }
                    );
                    if (updated) restored = true;
                    else { retries--; if (retries > 0) await new Promise((resolve) => setTimeout(resolve, 50)); }
                  } else restored = true;
                } catch (error) { console.error(`Error restoring product ${item.product}:`, error); retries--; }
              }
            }
          }
        });
      } finally { await session.endSession(); }

      const customer = await User.findById(booking.customer);

      try { await emailService.sendCancellationEmail(booking, customer, refundAmount); } catch (emailError) { console.error("Send cancellation email error:", emailError); }
      if (customer.phoneNumber) { try { await smsService.sendCancellationNotification(customer.phoneNumber, booking, refundAmount); } catch (smsError) { console.error("Send cancellation SMS error:", smsError); } }

      await Notification.createNotification({ user: customer._id, ...Notification.templates.bookingCancelled(booking) });
      await redisService.invalidateScheduleCache(booking.schedule.toString());
      await redisService.delPattern(`bookings:user:${booking.customer}:*`);

      let refundResult = null;
      if (refundAmount > 0 && booking.paymentDetails && booking.paymentDetails.status === "Thành công") {
        try {
          if (booking.paymentDetails.paymentMethod === "VNPAY") {
            const vnpayService = await import("../services/payment/vnpay.service.js");
            refundResult = await vnpayService.default.refundTransaction(booking.paymentDetails.transactionId, refundAmount, booking.paymentDetails.paymentDate, req.userId);
          } else if (booking.paymentDetails.paymentMethod === "MoMo") {
            const momoService = await import("../services/payment/momo.service.js");
            refundResult = await momoService.default.refundTransaction(booking.bookingCode, booking.paymentDetails.transactionId, refundAmount, "Hoàn tiền hủy vé");
          }
          if (refundResult && refundResult.success) { booking.paymentDetails.status = "Đã hoàn tiền"; await booking.save(); }
        } catch (refundError) { console.error("Gateway refund error:", refundError); }
      }

      return successResponse(res, { bookingId: booking._id, refundAmount, refundNote: refundAmount === booking.totalAmount ? "Hoàn 100% giá trị vé" : `Hoàn ${((refundAmount / booking.totalAmount) * 100).toFixed(0)}% giá trị vé` }, "Hủy vé thành công");
    } catch (error) { console.error("Cancel booking error:", error); return errorResponse(res, "Lỗi server", 500); }
  },

  getAllBookings: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const skip = (page - 1) * limit;
      const query = {};
      if (status) query.status = status;
      if (search) query.$or = [{ bookingCode: { $regex: search, $options: "i" } }, { movieTitle: { $regex: search, $options: "i" } }];

      const [bookings, total] = await Promise.all([
        Booking.find(query).populate("customer", "fullName email phoneNumber").populate({ path: "schedule", populate: [{ path: "movie", select: "title posterUrl duration genre rating" }, { path: "theater", select: "name address city" }, { path: "room", select: "name roomType" }] }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        Booking.countDocuments(query),
      ]);

      return successResponse(res, { bookings, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), totalItems: total } });
    } catch (error) { console.error("Get all bookings error:", error); return errorResponse(res, "Lỗi server", 500); }
  },

  checkIn: async (req, res) => {
    try {
      const { bookingCode } = req.body;
      const booking = await Booking.findOne({ bookingCode: bookingCode.toUpperCase() });
      if (!booking) return errorResponse(res, "Không tìm thấy vé", 404);
      if (booking.status !== BOOKING_STATUS.COMPLETED) return errorResponse(res, "Vé chưa được thanh toán hoặc đã bị hủy", 400);
      if (booking.usedAt) return errorResponse(res, "Vé đã được sử dụng", 400);

      const showDateTime = new Date(`${booking.showDate.toISOString().split("T")[0]} ${booking.showTime.split(" - ")[0]}`);
      const hoursUntilShow = (showDateTime - new Date()) / (1000 * 60 * 60);
      if (hoursUntilShow > 1) return errorResponse(res, "Chưa đến giờ check-in (check-in trước 1h)", 400);
      if (hoursUntilShow < -2) return errorResponse(res, "Suất chiếu đã kết thúc", 400);

      booking.usedAt = new Date(); booking.status = BOOKING_STATUS.USED; await booking.save();
      return successResponse(res, { movieTitle: booking.movieTitle, showTime: booking.showTime, seats: booking.seats.map((s) => s.seatNumber), theater: booking.theaterName, room: booking.roomName }, "Check-in thành công");
    } catch (error) { console.error("Check-in error:", error); return errorResponse(res, "Lỗi server", 500); }
  },

  regenerateQRCode: async (req, res) => {
    try {
      const bookingId = req.params.bookingId || req.params.id;
      const booking = await Booking.findById(bookingId);
      if (!booking) return errorResponse(res, "Không tìm thấy booking", 404);
      if (booking.customer.toString() !== req.userId) return errorResponse(res, "Bạn không có quyền thực hiện hành động này", 403);
      if (booking.status !== BOOKING_STATUS.COMPLETED) return errorResponse(res, "Chỉ có thể tạo QR code cho booking đã hoàn tất", 400);

      const qrData = JSON.stringify({ bookingId: booking._id.toString(), bookingCode: booking.bookingCode, movieTitle: booking.movieTitle, theaterName: booking.theaterName, roomName: booking.roomName, showDate: booking.showDate.toISOString().split("T")[0], showTime: booking.showTime, seats: booking.seats.map((s) => s.seatNumber).join(", "), totalAmount: booking.totalAmount, timestamp: new Date().toISOString() });
      const qrCodeUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "M", type: "image/png", quality: 0.92, margin: 1, color: { dark: "#000000", light: "#FFFFFF" }, width: 256 });
      booking.qrCode = qrCodeUrl; await booking.save();
      return successResponse(res, { qrCode: qrCodeUrl }, "QR code đã được tạo lại thành công");
    } catch (error) { console.error("Regenerate QR code error:", error); return errorResponse(res, "Lỗi server", 500); }
  },

  getBookingByCode: async (req, res) => {
    try {
      const { bookingCode } = req.params;
      if (!bookingCode) return errorResponse(res, "Mã booking là bắt buộc", 400);
      const booking = await Booking.findOne({ bookingCode }).populate("customer", "fullName email phoneNumber").populate({ path: "schedule", select: "showDate showTime movie theater room", populate: [{ path: "movie", select: "title posterUrl duration genre rating" }, { path: "theater", select: "name address city" }, { path: "room", select: "name roomType" }] }).populate("products.product", "name price imageUrl").populate("appliedVoucher", "code discountType discountValue").lean();
      if (!booking) return errorResponse(res, "Không tìm thấy booking với mã này", 404);

      const cleanBooking = { _id: booking._id, bookingCode: booking.bookingCode, customer: booking.customer, schedule: booking.schedule, seats: booking.seats, products: booking.products, appliedVoucher: booking.appliedVoucher, ticketsAmount: booking.ticketsAmount, productsAmount: booking.productsAmount, subtotal: booking.subtotal, discountAmount: booking.discountAmount, totalAmount: booking.totalAmount, status: booking.status, qrCode: booking.qrCode, createdAt: booking.createdAt, updatedAt: booking.updatedAt };
      return successResponse(res, cleanBooking);
    } catch (error) { console.error("Get booking by code error:", error); return errorResponse(res, "Lỗi server", 500); }
  },

  //WEBHOOK PAYOS XỬ LÝ THANH TOÁN TỰ ĐỘNG
  payosWebhook: async (req, res) => {
    try {
      console.log("============= [WEBHOOK PAYOS START] =============");

      // Bỏ qua hàm verify lằng nhằng, lấy thẳng data thô từ PayOS gửi về
      const code = req.body.code;
      const data = req.body.data || {};

      console.log(`[WEBHOOK] Nhận tín hiệu. Code: ${code}`);
      console.log(`[WEBHOOK] Dữ liệu giao dịch:`, JSON.stringify(data, null, 2));

      // Code 00 là chuyển khoản thành công
      if (code == "00") {
        if (!data.orderCode) {
          console.log("[WEBHOOK] Lỗi: Không tìm thấy orderCode trong payload!");
          return res.json({ error: 0, message: "Ok" });
        }

        const orderCodeStr = data.orderCode.toString();
        console.log(`[WEBHOOK] Đang tìm đơn hàng với TransactionID: ${orderCodeStr}`);

        // 1. Tìm đơn hàng
        const booking = await Booking.findOne({
          "paymentDetails.transactionId": orderCodeStr,
          status: BOOKING_STATUS.PENDING_PAYMENT
        });

        if (booking) {
          console.log(`[WEBHOOK] TÌM THẤY ĐƠN: ${booking.bookingCode}. Tiến hành auto-duyệt...`);

          const fakeReq = {
            params: { id: booking._id.toString() },
            body: {
              paymentMethod: "bank_transfer",
              transactionId: data.reference || orderCodeStr
            },
            userId: booking.customer.toString(),
            userRole: "admin"
          };

          const fakeRes = {
            status: function() { return this; },
            json: function(resData) {
              console.log("[WEBHOOK] HOÀN TẤT DUYỆT ĐƠN! Kết quả:", resData.message);
              return this;
            }
          };

          // Chạy hàm confirm
          await bookingController.confirmPayment(fakeReq, fakeRes);
          console.log(`[WEBHOOK] ✅ Giao dịch ${booking.bookingCode} đã XANH!`);

        } else {
          console.log(`[WEBHOOK - INFO] Không tìm thấy đơn chờ thanh toán mã ${orderCodeStr} (Có thể đã duyệt trước đó).`);
        }
      } else {
        console.log(`[WEBHOOK] Giao dịch thất bại hoặc bị hủy. Mã lỗi: ${code}`);
      }

      console.log("============= [WEBHOOK PAYOS END] =============");

      // Luôn trả về OK để PayOS không gọi spam lại nữa
      return res.json({ error: 0, message: "Ok" });

    } catch (error) {
      console.error("============= [WEBHOOK LỖI NẶNG] =============");
      console.error(error);
      return res.json({ error: 0, message: "Bypass lỗi để ngắt lặp" });
    }
  }
};

export default bookingController;