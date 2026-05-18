import mongoose from "mongoose";
import { BOOKING_STATUS } from "../constants/booking.js";
import Booking from "../models/booking.model.js";
import Movie from "../models/movie.model.js";
import Product from "../models/product.model.js";
import Schedule from "../models/schedule.model.js";
import Theater from "../models/theater.model.js";
import Voucher from "../models/voucher.model.js";
import emailService from "../services/email.service.js";
import momoService from "../services/payment/momo.service.js";
import vnpayService from "../services/payment/vnpay.service.js";
import redisService from "../services/redis.service.js";
import smsService from "../services/sms.service.js";
import websocketService from "../services/websocket.service.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const scheduleController = {
  getAllSchedules: async (req, res) => {
    try {
      const {
        movieId, theaterId, date, startDate, endDate, status, country,
        movieStatus, rating, genres, language, subtitle, year, minYear, maxYear,
        sortBy = "showDate", order = "asc", // Mặc định sắp xếp theo ngày chiếu gần nhất
        page = 1, limit = 20,
      } = req.query;

      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 20;
      const skip = (pageNumber - 1) * limitNumber;

      // 1. Xây dựng bộ lọc Query tương tự như cũ của fen
      const query = {
        ...getDeleteFilter(req.query),
      };

      if (movieId) query.movie = movieId;
      if (theaterId) query.theater = theaterId;
      if (status) query.status = status;

      // Xử lý khoảng ngày chiếu (Nếu có)
      if (date) {
        const startOfDate = new Date(date);
        startOfDate.setHours(0, 0, 0, 0);
        const endOfDate = new Date(date);
        endOfDate.setHours(23, 59, 59, 999);
        query.showDate = { $gte: startOfDate, $lte: endOfDate };
      } else if (startDate || endDate) {
        query.showDate = {};
        if (startDate) query.showDate.$gte = new Date(startDate);
        if (endDate) query.showDate.$lte = new Date(endDate);
      }

      // Cấu hình Sort dữ liệu
      const sort = { [sortBy]: order === "asc" ? 1 : -1 };

      // Cache Key dựa trên URL request
      const cacheKey = `schedules:all:${JSON.stringify(req.query)}:${pageNumber}:${limitNumber}`;
      try {
        const cachedData = await redisService.get(cacheKey);
        if (cachedData) return successResponse(res, cachedData, "Lấy lịch chiếu từ Cache thành công");
      } catch (e) {}

      // 2. THỰC THI TRUY VẤN: Thêm chặn skip và limit để phân trang
      const [schedules, total] = await Promise.all([
        Schedule.find(query)
            .populate("movie", "title posterUrl rating duration ageRestriction")
            .populate("theater", "name")
            .populate("room", "name")
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean(),
        Schedule.countDocuments(query), // Đếm tổng số lịch chiếu khớp bộ lọc
      ]);

      // 3. Đóng gói Payload trả về cấu trúc phân trang chuẩn hóa
      const payload = {
        schedules,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalItems: total,
          itemsPerPage: limitNumber,
        },
      };

      try { await redisService.set(cacheKey, payload, 15); } catch (e) {}

      return successResponse(res, payload, "Lấy danh sách lịch chiếu thành công");
    } catch (error) {
      console.error("Get all schedules error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  getSchedulesByMovie: async (req, res) => {
    try {
      const { movieId } = req.params;
      const { date } = req.query;

      const cacheKey = `schedules:movie:${movieId}:date:${date || 'all'}:includePast:${req.query.includePast || false}`;
      const cachedData = await redisService.get(cacheKey);
      if (cachedData) return successResponse(res, cachedData, "Lấy từ Cache siêu tốc");

      const movie = await Movie.findById(movieId);
      if (!movie) return errorResponse(res, "Không tìm thấy phim", 404);

      const query = { movie: movieId, status: { $in: ["Đang mở bán vé", "Sắp đầy"] } };

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (!date && !req.query.includePast) query.showDate = { $gte: startOfToday };
      if (date) {
        const searchDate = new Date(date);
        query.showDate = { $gte: new Date(searchDate.setHours(0, 0, 0)), $lt: new Date(searchDate.setHours(23, 59, 59)) };
      }

      const schedulesRaw = await Schedule.find(query)
          .populate("theater", "name address city")
          .sort({ showDate: 1, startTime: 1 })
          .lean();

      const currentTime = new Date();
      const schedules = req.query.includePast ? schedulesRaw : schedulesRaw.filter(schedule => {
        const showDate = new Date(schedule.showDate);
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        const showDateTime = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate(), hours, minutes);

        const cutoffTime = new Date(showDateTime.getTime() + 30 * 60000);
        return cutoffTime > currentTime;
      });

      const groupedByTheater = schedules.reduce((acc, schedule) => {
        const theaterId = schedule.theater._id.toString();
        if (!acc[theaterId]) acc[theaterId] = { theater: schedule.theater, schedules: [] };
        acc[theaterId].schedules.push(schedule);
        return acc;
      }, {});

      const finalResult = {
        movie: { id: movie._id, title: movie.title, posterUrl: movie.posterUrl, duration: movie.duration },
        theaters: Object.values(groupedByTheater),
      };

      await redisService.set(cacheKey, finalResult, 300);

      return successResponse(res, finalResult);
    } catch (error) {
      console.error("Get schedules by movie error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  getSchedulesByTheater: async (req, res) => {
    try {
      const { theaterId } = req.params;
      const { date } = req.query;

      const cacheKey = `schedules:theater:${theaterId}:date:${date || 'all'}:includePast:${req.query.includePast || false}`;
      const cachedData = await redisService.get(cacheKey);
      if (cachedData) return successResponse(res, cachedData, "Lấy từ Cache siêu tốc");

      const theater = await Theater.findById(theaterId);
      if (!theater) return errorResponse(res, "Không tìm thấy rạp", 404);

      const query = { theater: theaterId, status: { $in: ["Đang mở bán vé", "Sắp đầy"] } };

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (!date && !req.query.includePast) query.showDate = { $gte: startOfToday };
      if (date) {
        const searchDate = new Date(date);
        query.showDate = { $gte: new Date(searchDate.setHours(0, 0, 0)), $lt: new Date(searchDate.setHours(23, 59, 59)) };
      }

      const schedulesRaw = await Schedule.find(query)
          .populate("movie", "title posterUrl duration rating")
          .sort({ startTime: 1 })
          .lean();

      const currentTime = new Date();
      const schedules = req.query.includePast ? schedulesRaw : schedulesRaw.filter(schedule => {
        const showDate = new Date(schedule.showDate);
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        const showDateTime = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate(), hours, minutes);

        const cutoffTime = new Date(showDateTime.getTime() + 30 * 60000);
        return cutoffTime > currentTime;
      });

      const groupedByMovie = schedules.reduce((acc, schedule) => {
        const movieId = schedule.movie._id.toString();
        if (!acc[movieId]) acc[movieId] = { movie: schedule.movie, schedules: [] };
        acc[movieId].schedules.push(schedule);
        return acc;
      }, {});

      const finalResult = {
        theater: { id: theater._id, name: theater.name, address: theater.address, city: theater.city },
        movies: Object.values(groupedByMovie),
      };

      await redisService.set(cacheKey, finalResult, 300);

      return successResponse(res, finalResult);
    } catch (error) {
      console.error("Get schedules by theater error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  getScheduleById: async (req, res) => {
    try {
      const { id } = req.params;
      const scheduleDoc = await Schedule.findById(id);
      if (!scheduleDoc) return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      await scheduleDoc.releaseExpiredHolds();
      const updatedSchedule = await Schedule.findById(id).populate("movie", "title posterUrl duration rating").populate("theater", "name address city").lean();
      return successResponse(res, updatedSchedule);
    } catch (error) {
      console.error("Get schedule by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  createSchedule: async (req, res) => {
    try {
      if (!req.body) return errorResponse(res, "Request body is empty", 400);
      const { movieId, theaterId, roomId, roomName, roomType, showDate, startTime, endTime, ticketPrices, language, subtitles } = req.body;
      const fixedSubtitles = subtitles && typeof subtitles === "object" && !Array.isArray(subtitles) ? Object.values(subtitles) : subtitles;

      const movie = await Movie.findById(movieId);
      if (!movie) return errorResponse(res, "Không tìm thấy phim", 404);

      const theater = await Theater.findById(theaterId);
      if (!theater) return errorResponse(res, "Không tìm thấy rạp", 404);
      if (!theater.rooms || theater.rooms.length === 0) return errorResponse(res, "Rạp này chưa có phòng chiếu nào", 400);

      const room = theater.rooms.id(roomId);
      if (!room) return errorResponse(res, `Không tìm thấy phòng chiếu`, 404);
      if (!room.seatMap || room.seatMap.length === 0) return errorResponse(res, "Phòng chiếu này chưa có sơ đồ ghế", 400);

      const hasConflict = await Schedule.checkRoomConflict(theaterId, roomId, new Date(showDate), startTime, endTime);
      if (hasConflict) return errorResponse(res, "Phòng chiếu đã có lịch chiếu trùng giờ", 400);

      const seatAvailability = room.seatMap.map((seat) => ({
        seatNumber: seat.seatNumber, seatType: seat.seatType, row: seat.row, column: seat.column, isBooked: false, isAvailable: true,
      }));

      const scheduleLanguage = language || movie.language || "Vietnamese";
      const scheduleSubtitles = fixedSubtitles || movie.subtitles || ["Vietnamese"];

      const newSchedule = new Schedule({
        movie: movieId, theater: theaterId, room: roomId, roomName: roomName || room.roomName, roomType: roomType || room.roomType,
        showDate: new Date(showDate), startTime, endTime, ticketPrices, seatAvailability, totalSeats: room.seatMap.length,
        language: scheduleLanguage, subtitles: scheduleSubtitles, createdBy: req.userId,
      });

      await newSchedule.save();
      const populatedSchedule = await Schedule.findById(newSchedule._id).populate("movie", "title posterUrl").populate("theater", "name address");

      redisService.delPattern(`schedules:*`).catch(() => {});

      return successResponse(res, populatedSchedule, "Tạo lịch chiếu thành công", 201);
    } catch (error) {
      console.error("Create schedule error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  updateSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updatedBy = req.userId;

      if (updateData.subtitles && typeof updateData.subtitles === "object" && !Array.isArray(updateData.subtitles)) {
        updateData.subtitles = Object.values(updateData.subtitles);
      }

      const schedule = await Schedule.findById(id);
      if (!schedule) return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      if (schedule.bookedSeatsCount > 0) return errorResponse(res, "Không thể cập nhật lịch chiếu đã có người đặt vé", 400);

      if (updateData.startTime || updateData.endTime || updateData.showDate) {
        try {
          const hasConflict = await Schedule.checkRoomConflict(schedule.theater, schedule.room, updateData.showDate ? new Date(updateData.showDate) : schedule.showDate, updateData.startTime || schedule.startTime, updateData.endTime || schedule.endTime, id);
          if (hasConflict) return errorResponse(res, "Phòng chiếu đã có lịch chiếu trùng giờ", 400);
        } catch (conflictError) {}
      }

      const updatedSchedule = await Schedule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("movie", "title posterUrl").populate("theater", "name address").select("-seatAvailability").lean();

      redisService.delPattern(`schedules:*`).catch(() => {});
      return successResponse(res, updatedSchedule, "Cập nhật lịch chiếu thành công");
    } catch (error) {
      console.error("Update schedule error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  cancelSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const schedule = await Schedule.findById(id);
      if (!schedule) return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      if (schedule.status === "Đã hủy") return errorResponse(res, "Lịch chiếu đã được hủy trước đó", 400);

      const session = await mongoose.startSession();
      let refundedCount = 0;
      let cancelledCount = 0;
      let failedRefunds = [];

      try {
        const allBookings = await Booking.find({ schedule: id, status: { $ne: BOOKING_STATUS.CANCELLED } }).session(session);

        if (allBookings.length > 0) {
          await session.withTransaction(async () => {
            for (const booking of allBookings) {
              try {
                let refundAmount = 0;
                if (booking.status === BOOKING_STATUS.COMPLETED && booking.totalAmount) refundAmount = booking.totalAmount;

                booking.status = BOOKING_STATUS.CANCELLED;
                booking.cancelledBy = req.userId;
                booking.cancelledAt = new Date();
                booking.cancellationReason = `Lịch chiếu bị hủy: ${reason || "Không có lý do"}`;
                if (refundAmount > 0) booking.refundAmount = refundAmount;
                await booking.save({ session });

                await schedule.releaseSeats(booking.seats.map((s) => s.seatNumber), session);

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
                          const updated = await Product.findOneAndUpdate({ _id: item.product, __v: product.__v }, { $inc: { stockQuantity: item.quantity, totalSold: -item.quantity, __v: 1 }, $set: { inStock: true } }, { session, new: true });
                          if (updated) restored = true;
                          else { retries--; if (retries > 0) await new Promise((resolve) => setTimeout(resolve, 50)); }
                        } else restored = true;
                      } catch (error) { retries--; }
                    }
                  }
                }

                if (refundAmount > 0 && booking.paymentDetails && booking.paymentDetails.status === "Thành công") {
                  let refundResult = null;
                  if (booking.paymentDetails.paymentMethod === "VNPAY") refundResult = await vnpayService.refundTransaction(booking.paymentDetails.transactionId, refundAmount, booking.paymentDetails.paymentDate, req.userId);
                  else if (booking.paymentDetails.paymentMethod === "MoMo") refundResult = await momoService.refundTransaction(booking.bookingCode, booking.paymentDetails.transactionId, refundAmount, "Hoàn tiền hủy lịch chiếu");

                  if (refundResult && refundResult.success) {
                    booking.paymentDetails.status = "Đã hoàn tiền"; await booking.save({ session }); refundedCount++;
                  } else {
                    failedRefunds.push({ bookingId: booking._id, bookingCode: booking.bookingCode, reason: refundResult?.error || "Gateway refund failed" });
                  }
                } else {
                  cancelledCount++;
                  if (refundAmount > 0) refundedCount++;
                }

                try {
                  const customer = await (await import("../models/user.model.js")).default.findById(booking.customer);
                  if (customer) {
                    await emailService.sendCancellationEmail(booking, customer, refundAmount).catch(() => {});
                    if (customer.phoneNumber) await smsService.sendCancellationNotification(customer.phoneNumber, booking, refundAmount).catch(() => {});
                  }
                } catch (notifError) {}
              } catch (bookingError) {
                failedRefunds.push({ bookingId: booking._id, bookingCode: booking.bookingCode, reason: bookingError.message });
              }
            }

            schedule.status = "Đã hủy"; schedule.updatedBy = req.userId; await schedule.save({ session });
            websocketService.emitToSchedule(id.toString(), "schedule-cancelled", { scheduleId: id, reason: reason });
            redisService.invalidateScheduleCache(id.toString()).catch(() => {});
            redisService.delPattern(`schedules:*`).catch(() => {}); // Xóa cache
          });

          return successResponse(res, { cancelledBookings: allBookings.length, refundedCount, cancelledCount, failedRefunds: failedRefunds.length > 0 ? failedRefunds : undefined }, `Hủy lịch chiếu thành công. Đã hủy ${allBookings.length} đơn đặt vé${failedRefunds.length > 0 ? `. ${failedRefunds.length} đơn cần xử lý hoàn tiền thủ công.` : ""}`);
        } else {
          schedule.status = "Đã hủy"; schedule.updatedBy = req.userId; await schedule.save({ session });
          redisService.invalidateScheduleCache(id.toString()).catch(() => {});
          redisService.delPattern(`schedules:*`).catch(() => {}); // Xóa cache
          return successResponse(res, { reason }, "Hủy lịch chiếu thành công");
        }
      } finally { await session.endSession(); }
    } catch (error) { console.error("Cancel schedule error:", error); return errorResponse(res, "Lỗi server", 500); }
  },

  deleteSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const schedule = await Schedule.findById(id);
      if (!schedule) return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      if (schedule.bookedSeatsCount > 0) return errorResponse(res, "Không thể xóa lịch chiếu đã có người đặt vé", 400);

      schedule.isDeleted = true; schedule.updatedBy = req.userId; await schedule.save();
      redisService.invalidateScheduleCache(id.toString()).catch(() => {});
      redisService.delPattern(`schedules:*`).catch(() => {});
      return successResponse(res, {}, "Xóa lịch chiếu thành công");
    } catch (error) { console.error("Delete schedule error:", error); return errorResponse(res, "Lỗi server", 500); }
  },
};

export default scheduleController;