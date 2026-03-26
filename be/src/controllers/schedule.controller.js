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
  // Lấy danh sách lịch chiếu (có filter)
  getAllSchedules: async (req, res) => {
    try {
      const {
        movieId,
        theaterId,
        date,
        startDate,
        endDate,
        status,
        country,
        movieStatus,
        rating,
        genres,
        language,
        subtitle,
        year,
        minYear,
        maxYear,
        sortBy,

        page = 1,
        limit = 20,
      } = req.query;

      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 20;
      const skip = (pageNumber - 1) * limitNumber;
      
      //  FIX: Add soft delete filter
      const scheduleMatch = {
        ...getDeleteFilter(req.query),
      };

      if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
        scheduleMatch.movie = new mongoose.Types.ObjectId(movieId);
      }

      if (theaterId && mongoose.Types.ObjectId.isValid(theaterId)) {
        scheduleMatch.theater = new mongoose.Types.ObjectId(theaterId);
      }

      if (status) {
        scheduleMatch.status = status;
      }

      // Fix: Filter past schedules for public listing
      // Chỉ admin mới cần xem lịch cũ, user thường thì không
      // API này dùng chung, nên ta check role hoặc giả định default là public query?
      // Nhưng an toàn nhất là thêm filter thời gian nếu không phải admin
      // Tuy nhiên context req.userRole có thể không có nếu public route không auth
      // Public route /schedules thường chỉ nên trả về valid schedules
      
      const now = new Date();
      // Logic: showDate >= today
      // AND with specific time check via aggregation or simplified check
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Nếu không có filter date specific, mặc định chỉ lấy từ hôm nay trở đi
      if (!date && !startDate && !endDate && !req.query.includePast) {
         scheduleMatch.showDate = { $gte: startOfToday };
      }

      // Lọc theo ngày chiếu / khoảng ngày
      if (date) {
        const d = new Date(date);
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        scheduleMatch.showDate = {
          $gte: startOfDay,
          $lt: endOfDay,
        };
      } else if (startDate && endDate) {
        scheduleMatch.showDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Ngôn ngữ lịch chiếu
      if (language) {
        scheduleMatch.language = language;
      }

      // Phụ đề lịch chiếu / phiên bản
      if (subtitle) {
        scheduleMatch.subtitles = { $in: [subtitle] };
      }

      const movieMatch = {
        "movie.isDeleted": { $ne: true },
      };

      // Quốc gia
      if (country) {
        const countries = Array.isArray(country)
          ? country
          : country
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean);

        if (countries.length) {
          movieMatch["movie.country"] = { $in: countries };
        }
      }

      // Trạng thái phim: Đang chiếu / Sắp chiếu / Ngừng chiếu
      if (movieStatus) {
        movieMatch["movie.status"] = movieStatus;
      }

      // Rating: P, C13, C16, C18
      if (rating) {
        movieMatch["movie.rating"] = rating;
      }

      // Thể loại (genreId)
      if (genres) {
        const genreIds = (Array.isArray(genres) ? genres : genres.split(","))
          .map((g) => g.trim())
          .filter((g) => mongoose.Types.ObjectId.isValid(g))
          .map((g) => new mongoose.Types.ObjectId(g));

        if (genreIds.length) {
          movieMatch["movie.genres"] = { $in: genreIds };
        }
      }

      // Năm phát hành (từ releaseDate)
      const yearNumber = year ? parseInt(year, 10) : null;
      const minYearNumber = minYear ? parseInt(minYear, 10) : null;
      const maxYearNumber = maxYear ? parseInt(maxYear, 10) : null;

      if (yearNumber) {
        const startOfYear = new Date(yearNumber, 0, 1);
        const endOfYear = new Date(yearNumber + 1, 0, 1);
        movieMatch["movie.releaseDate"] = { $gte: startOfYear, $lt: endOfYear };
      } else if (minYearNumber || maxYearNumber) {
        movieMatch["movie.releaseDate"] = {};
        if (minYearNumber) {
          movieMatch["movie.releaseDate"].$gte = new Date(minYearNumber, 0, 1);
        }
        if (maxYearNumber) {
          movieMatch["movie.releaseDate"].$lt = new Date(maxYearNumber + 1, 0, 1);
        }
      }

      let sortStage = { showDate: 1, startTime: 1 }; // mặc định

      switch (sortBy) {
        case "latest": // Mới nhất
          sortStage = {
            "movie.releaseDate": -1,
            showDate: 1,
            startTime: 1,
          };
          break;
        case "updated": // Mới cập nhật
          sortStage = { updatedAt: -1 };
          break;
        case "rating": // Điểm IMDB
          sortStage = {
            "movie.averageRating": -1,
            "movie.totalReviews": -1,
            showDate: 1,
          };
          break;
        case "views": // Lượt xem
          sortStage = {
            "movie.viewCount": -1,
            showDate: 1,
          };
          break;
        default:
          break;
      }

      const pipeline = [
        { $match: scheduleMatch },
        {
          $lookup: {
            from: "movies",
            localField: "movie",
            foreignField: "_id",
            as: "movie",
          },
        },
        { $unwind: "$movie" },
        {
          $lookup: {
            from: "theaters",
            localField: "theater",
            foreignField: "_id",
            as: "theater",
          },
        },
        { $unwind: "$theater" },
        { $match: movieMatch },
        { $sort: sortStage },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limitNumber }],
            totalCount: [{ $count: "count" }],
          },
        },
      ];

      const result = await Schedule.aggregate(pipeline);
      const schedules = result[0]?.data || [];
      const total = result[0]?.totalCount?.[0]?.count || 0;

      return successResponse(res, {
        schedules,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get all schedules error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy lịch chiếu theo phim
  getSchedulesByMovie: async (req, res) => {
    try {
      const { movieId } = req.params;
      const { date } = req.query;

      const movie = await Movie.findById(movieId);
      if (!movie) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }

      const query = {
        movie: movieId,
        status: { $in: ["Đang mở bán vé", "Sắp đầy"] },
      };

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Mặc định ẩn lịch đã qua (ngày hôm qua) nếu không có yêu cầu cụ thể
      if (!date && !req.query.includePast) {
        query.showDate = { $gte: startOfToday };
      }

      if (date) {
        const searchDate = new Date(date);
        query.showDate = {
          $gte: new Date(searchDate.setHours(0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59)),
        };
      }

      const schedules = await Schedule.find(query)
        .populate("theater", "name address city")
        .sort({ showDate: 1, startTime: 1 })
        .lean();

      // Group by theater
      const groupedByTheater = schedules.reduce((acc, schedule) => {
        const theaterId = schedule.theater._id.toString();
        if (!acc[theaterId]) {
          acc[theaterId] = {
            theater: schedule.theater,
            schedules: [],
          };
        }
        acc[theaterId].schedules.push(schedule);
        return acc;
      }, {});

      return successResponse(res, {
        movie: {
          id: movie._id,
          title: movie.title,
          posterUrl: movie.posterUrl,
          duration: movie.duration,
        },
        theaters: Object.values(groupedByTheater),
      });
    } catch (error) {
      console.error("Get schedules by movie error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy lịch chiếu theo rạp
  getSchedulesByTheater: async (req, res) => {
    try {
      const { theaterId } = req.params;
      const { date } = req.query;

      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      const query = {
        theater: theaterId,
        status: { $in: ["Đang mở bán vé", "Sắp đầy"] },
      };

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Mặc định ẩn lịch đã qua nếu không có yêu cầu cụ thể
      if (!date && !req.query.includePast) {
        query.showDate = { $gte: startOfToday };
      }

      if (date) {
        const searchDate = new Date(date);
        query.showDate = {
          $gte: new Date(searchDate.setHours(0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59)),
        };
      }

      const schedules = await Schedule.find(query)
        .populate("movie", "title posterUrl duration rating")
        .sort({ startTime: 1 })
        .lean();

      // Group by movie
      const groupedByMovie = schedules.reduce((acc, schedule) => {
        const movieId = schedule.movie._id.toString();
        if (!acc[movieId]) {
          acc[movieId] = {
            movie: schedule.movie,
            schedules: [],
          };
        }
        acc[movieId].schedules.push(schedule);
        return acc;
      }, {});

      return successResponse(res, {
        theater: {
          id: theater._id,
          name: theater.name,
          address: theater.address,
          city: theater.city,
        },
        movies: Object.values(groupedByMovie),
      });
    } catch (error) {
      console.error("Get schedules by theater error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy chi tiết lịch chiếu (bao gồm seat availability)
  getScheduleById: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Tìm và xử lý release hold trước
      const scheduleDoc = await Schedule.findById(id);
      if (!scheduleDoc) return errorResponse(res, "Không tìm thấy lịch chiếu", 404);

      await scheduleDoc.releaseExpiredHolds();

      // 2. Trả về data đã được cập nhật
      const updatedSchedule = await Schedule.findById(id)
        .populate("movie", "title posterUrl duration rating")
        .populate("theater", "name address city")
        .lean(); // Dùng lean để lấy mảng ghế nhanh và đầy đủ

      return successResponse(res, updatedSchedule);
    } catch (error) {
      console.error("Get schedule by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Tạo lịch chiếu mới (Admin)
  createSchedule: async (req, res) => {
    try {
      console.log("=== CREATE SCHEDULE START ===");
      console.log("Create schedule - Body:", JSON.stringify(req.body, null, 2));
      console.log("User ID:", req.userId);
      console.log("User Role:", req.userRole);

      if (!req.body) {
        return errorResponse(res, "Request body is empty", 400);
      }

      const {
        movieId,
        theaterId,
        roomId,
        roomName,
        roomType,
        showDate,
        startTime,
        endTime,
        ticketPrices,
        language,
        subtitles,
      } = req.body;

      // Fix Swagger array issue
      const fixedSubtitles =
        subtitles && typeof subtitles === "object" && !Array.isArray(subtitles) ? Object.values(subtitles) : subtitles;

      console.log("Validating movie:", movieId);
      // Validate movie
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }
      console.log("Movie found:", movie.title);
      console.log("Movie language:", movie.language);
      console.log("Movie subtitles:", movie.subtitles);

      console.log("Validating theater:", theaterId);
      // Validate theater
      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      console.log("Theater rooms:", theater.rooms);
      console.log("Theater rooms length:", theater.rooms?.length);
      console.log("Looking for roomId:", roomId);

      // Validate room
      if (!theater.rooms || theater.rooms.length === 0) {
        return errorResponse(res, "Rạp này chưa có phòng chiếu nào", 400);
      }

      const room = theater.rooms.id(roomId);
      console.log("Found room:", room);

      if (!room) {
        const availableRoomIds = theater.rooms.map((r) => r._id.toString()).join(", ");
        return errorResponse(res, `Không tìm thấy phòng chiếu. Các phòng có sẵn: ${availableRoomIds}`, 404);
      }

      if (!room.seatMap || room.seatMap.length === 0) {
        return errorResponse(res, "Phòng chiếu này chưa có sơ đồ ghế", 400);
      }

      // Check conflict
      const hasConflict = await Schedule.checkRoomConflict(theaterId, roomId, new Date(showDate), startTime, endTime);

      if (hasConflict) {
        return errorResponse(res, "Phòng chiếu đã có lịch chiếu trùng giờ", 400);
      }

      // Initialize seat availability từ room
      console.log("Room seatMap:", room.seatMap);
      console.log("Room seatMap length:", room.seatMap?.length);

      if (!room.seatMap) {
        console.error("Room seatMap is undefined!");
        return errorResponse(res, "Phòng chiếu không có sơ đồ ghế (seatMap undefined)", 400);
      }

      if (!Array.isArray(room.seatMap)) {
        console.error("Room seatMap is not an array:", typeof room.seatMap);
        return errorResponse(res, "Sơ đồ ghế không hợp lệ", 400);
      }

      const seatAvailability = room.seatMap.map((seat) => ({
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        row: seat.row,       // <--- PHẢI THÊM DÒNG NÀY
        column: seat.column, // <--- PHẢI THÊM DÒNG NÀY
        isBooked: false,
        isAvailable: true,   // <--- THÊM DÒNG NÀY CHO ĐỒNG BỘ
      }));

      console.log("Creating schedule with data...");
      const scheduleLanguage = language || movie.language || "Vietnamese";
      const scheduleSubtitles = fixedSubtitles || movie.subtitles || ["Vietnamese"];

      console.log("Schedule language:", scheduleLanguage);
      console.log("Schedule subtitles:", scheduleSubtitles);

      const newSchedule = new Schedule({
        movie: movieId,
        theater: theaterId,
        room: roomId,
        roomName: roomName || room.roomName,
        roomType: roomType || room.roomType,
        showDate: new Date(showDate),
        startTime,
        endTime,
        ticketPrices,
        seatAvailability,
        totalSeats: room.seatMap.length,
        language: scheduleLanguage,
        subtitles: scheduleSubtitles,
        createdBy: req.userId,
      });

      await newSchedule.save();

      const populatedSchedule = await Schedule.findById(newSchedule._id)
        .populate("movie", "title posterUrl")
        .populate("theater", "name address");

      return successResponse(res, populatedSchedule, "Tạo lịch chiếu thành công", 201);
    } catch (error) {
      console.error("Create schedule error:", error);
      console.error("Error message:", error.message);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  // Cập nhật lịch chiếu (Admin)
  updateSchedule: async (req, res) => {
    try {
      console.log("=== UPDATE SCHEDULE START ===");
      console.log("Schedule ID:", req.params.id);
      console.log("Update data:", req.body);

      const { id } = req.params;
      const updateData = req.body;
      updateData.updatedBy = req.userId;

      // Fix Swagger array issue
      if (updateData.subtitles && typeof updateData.subtitles === "object" && !Array.isArray(updateData.subtitles)) {
        updateData.subtitles = Object.values(updateData.subtitles);
      }

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      }

      console.log("Current schedule:", schedule);

      // Không cho update nếu đã có booking
      if (schedule.bookedSeatsCount > 0) {
        return errorResponse(res, "Không thể cập nhật lịch chiếu đã có người đặt vé", 400);
      }

      // Check conflict nếu update time
      if (updateData.startTime || updateData.endTime || updateData.showDate) {
        console.log("Checking conflict...");
        try {
          const hasConflict = await Schedule.checkRoomConflict(
            schedule.theater,
            schedule.room,
            updateData.showDate ? new Date(updateData.showDate) : schedule.showDate,
            updateData.startTime || schedule.startTime,
            updateData.endTime || schedule.endTime,
            id
          );

          if (hasConflict) {
            return errorResponse(res, "Phòng chiếu đã có lịch chiếu trùng giờ", 400);
          }
        } catch (conflictError) {
          console.error("Conflict check error:", conflictError);
          // Continue anyway
        }
      }

      console.log("Updating schedule...");
      const updatedSchedule = await Schedule.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("movie", "title posterUrl")
        .populate("theater", "name address")
        .select("-seatAvailability")
        .lean();

      console.log("Schedule updated successfully");
      return successResponse(res, updatedSchedule, "Cập nhật lịch chiếu thành công");
    } catch (error) {
      console.error("Update schedule error:", error);
      console.error("Error message:", error.message);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  // Hủy lịch chiếu (Admin)
  cancelSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      }

      if (schedule.status === "Đã hủy") {
        return errorResponse(res, "Lịch chiếu đã được hủy trước đó", 400);
      }

      // : Kiểm tra bookings chi tiết - tất cả status, không chỉ COMPLETED
      const session = await mongoose.startSession();
      let refundedCount = 0;
      let cancelledCount = 0;
      let failedRefunds = [];

      try {
        // : Check tất cả bookings liên quan (tất cả status trừ CANCELLED)
        const allBookings = await Booking.find({
          schedule: id,
          status: { $ne: BOOKING_STATUS.CANCELLED },
        }).session(session);

        if (allBookings.length > 0) {
          await session.withTransaction(async () => {
            for (const booking of allBookings) {
              try {
                // Tính refund - khi cancel schedule thì hoàn 100%
                let refundAmount = 0;
                if (booking.status === BOOKING_STATUS.COMPLETED && booking.totalAmount) {
                  refundAmount = booking.totalAmount;
                }

                // Cập nhật booking
                booking.status = BOOKING_STATUS.CANCELLED;
                booking.cancelledBy = req.userId;
                booking.cancelledAt = new Date();
                booking.cancellationReason = `Lịch chiếu bị hủy: ${reason || "Không có lý do"}`;
                if (refundAmount > 0) {
                  booking.refundAmount = refundAmount;
                }
                await booking.save({ session });

                // Release seats (use session-aware release)
                await schedule.releaseSeats(
                  booking.seats.map((s) => s.seatNumber),
                  session
                );

                // Rollback voucher
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

                // Restore product stock
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
                          restored = true;
                        }
                      } catch (error) {
                        console.error(`Error restoring product ${item.product}:`, error);
                        retries--;
                      }
                    }
                  }
                }

                // : Refund qua gateway nếu đã thanh toán và có refundAmount
                if (refundAmount > 0 && booking.paymentDetails && booking.paymentDetails.status === "Thành công") {
                  let refundResult = null;

                  if (booking.paymentDetails.paymentMethod === "VNPAY") {
                    refundResult = await vnpayService.refundTransaction(
                      booking.paymentDetails.transactionId,
                      refundAmount,
                      booking.paymentDetails.paymentDate,
                      req.userId
                    );
                  } else if (booking.paymentDetails.paymentMethod === "MoMo") {
                    refundResult = await momoService.refundTransaction(
                      booking.bookingCode,
                      booking.paymentDetails.transactionId,
                      refundAmount,
                      "Hoàn tiền hủy lịch chiếu"
                    );
                  }

                  if (refundResult && refundResult.success) {
                    booking.paymentDetails.status = "Đã hoàn tiền";
                    await booking.save({ session });
                    refundedCount++;
                  } else {
                    // Lưu booking cần refund thủ công
                    failedRefunds.push({
                      bookingId: booking._id,
                      bookingCode: booking.bookingCode,
                      reason: refundResult?.error || "Gateway refund failed",
                    });
                  }
                } else {
                  // Booking chưa thanh toán hoặc thanh toán tại quầy
                  cancelledCount++;
                  if (refundAmount > 0) {
                    refundedCount++;
                  }
                }

                // Gửi thông báo cho khách hàng (không block transaction)
                try {
                  const customer = await (await import("../models/user.model.js")).default.findById(booking.customer);
                  if (customer) {
                    await emailService.sendCancellationEmail(booking, customer, refundAmount).catch(() => {});
                    if (customer.phoneNumber) {
                      await smsService
                        .sendCancellationNotification(customer.phoneNumber, booking, refundAmount)
                        .catch(() => {});
                    }
                  }
                } catch (notifError) {
                  console.error("Send notification error:", notifError);
                }
              } catch (bookingError) {
                console.error(`Error cancelling booking ${booking._id}:`, bookingError);
                failedRefunds.push({
                  bookingId: booking._id,
                  bookingCode: booking.bookingCode,
                  reason: bookingError.message,
                });
              }
            }

            // Cập nhật schedule status sau khi cancel tất cả bookings
            schedule.status = "Đã hủy";
            schedule.updatedBy = req.userId;
            await schedule.save({ session });

            // Broadcast WebSocket
            websocketService.emitToSchedule(id.toString(), "schedule-cancelled", {
              scheduleId: id,
              reason: reason,
            });

            // Xóa cache
            redisService.invalidateScheduleCache(id.toString()).catch(() => {});
          });

          return successResponse(
            res,
            {
              cancelledBookings: allBookings.length,
              refundedCount,
              cancelledCount,
              failedRefunds: failedRefunds.length > 0 ? failedRefunds : undefined,
            },
            `Hủy lịch chiếu thành công. Đã hủy ${allBookings.length} đơn đặt vé${failedRefunds.length > 0 ? `. ${failedRefunds.length} đơn cần xử lý hoàn tiền thủ công.` : ""}`
          );
        } else {
          // Không có bookings, chỉ cập nhật schedule status
          schedule.status = "Đã hủy";
          schedule.updatedBy = req.userId;
          await schedule.save({ session });

          // Xóa cache
          redisService.invalidateScheduleCache(id.toString()).catch(() => {});

          return successResponse(res, { reason }, "Hủy lịch chiếu thành công");
        }
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error("Cancel schedule error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Xóa lịch chiếu (Admin)
  deleteSchedule: async (req, res) => {
    try {
      const { id } = req.params;

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return errorResponse(res, "Không tìm thấy lịch chiếu", 404);
      }

      // Chỉ cho xóa nếu chưa có booking
      if (schedule.bookedSeatsCount > 0) {
        return errorResponse(res, "Không thể xóa lịch chiếu đã có người đặt vé", 400);
      }

      //  FIX: Soft delete
      schedule.isDeleted = true;
      schedule.updatedBy = req.userId;
      await schedule.save();

      // Xóa cache
      redisService.invalidateScheduleCache(id.toString()).catch(() => {});
      
      // await Schedule.findByIdAndDelete(id);

      return successResponse(res, {}, "Xóa lịch chiếu thành công");
    } catch (error) {
      console.error("Delete schedule error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default scheduleController;
