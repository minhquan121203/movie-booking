import Theater from "../models/theater.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const theaterController = {
  // Lấy danh sách rạp
  getAllTheaters: async (req, res) => {
    try {
      const {
        city,
        district,
        isActive,
        search,
        minRating,
        maxRating,
        amenities,
        roomType,
        longitude,
        latitude,
        maxDistance,
        page = 1,
        limit = 10,
        sortBy = "city",
        order = "asc",
      } = req.query;

      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const query = {};
      const currentUser = req.user;

      // LƯỚI LỌC QUYỀN LỰC
      if (currentUser && currentUser.role === 'admin' && currentUser.assignedCity) {
        // Bắt buộc Rạp phải nằm trong Thành phố mà Admin này quản lý
        query.city = currentUser.assignedCity;

        // Nếu user cố tình search city khác, mình ghi đè luôn để chặn
        if (city && city.toLowerCase() !== currentUser.assignedCity.toLowerCase()) {
          return successResponse(res, {
            theaters: [],
            pagination: { currentPage: 1, totalPages: 0, totalItems: 0 }
          }, "Không có rạp nào (Bạn không có quyền xem rạp ở khu vực này)");
        }
      } else if (city) {
        // Dành cho Super Admin hoặc Customer search bình thường
        query.city = { $regex: city, $options: "i" };
      }

      // Quận / huyện
      if (district) {
        query.district = { $regex: district, $options: "i" };
      }

      //  FIX: Soft delete filter
      Object.assign(query, getDeleteFilter(req.query));

      // Support filtering by business status isActive field (distinct from isDeleted)
      if (typeof isActive !== "undefined") {
        query.isActive = isActive === "true";
      }

      // Rating rạp
      if (minRating || maxRating) {
        query.rating = {};
        if (minRating) query.rating.$gte = Number(minRating);
        if (maxRating) query.rating.$lte = Number(maxRating);
      }

      // Amenities (tiện ích)
      if (amenities) {
        const amenityArr = (Array.isArray(amenities) ? amenities : amenities.split(","))
          .map((a) => a.trim())
          .filter(Boolean);
        if (amenityArr.length) {
          query.amenities = { $all: amenityArr };
        }
      }

      // Loại phòng chiếu (2D, 3D, IMAX, 4DX)
      if (roomType) {
        const roomTypes = (Array.isArray(roomType) ? roomType : roomType.split(","))
          .map((t) => t.trim())
          .filter(Boolean);
        if (roomTypes.length) {
          query["rooms.roomType"] = { $in: roomTypes };
        }
      }

      // Tìm kiếm theo tên + địa chỉ
      if (search) {
        query.$or = [{ name: { $regex: search, $options: "i" } }, { address: { $regex: search, $options: "i" } }];
      }

      // Tìm rạp gần vị trí (geo)
      if (longitude && latitude) {
        const lng = parseFloat(longitude);
        const lat = parseFloat(latitude);
        const maxDist = maxDistance ? parseInt(maxDistance, 10) : 10000; // 10km

        if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
          query.location = {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: maxDist,
            },
          };
        }
      }

      // Sort
      const allowedSortFields = ["city", "name", "rating", "totalReviews", "createdAt", "updatedAt"];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : "city";
      const sort = { [sortField]: order === "desc" ? -1 : 1 };

      const [theaters, total] = await Promise.all([
        Theater.find(query)

          .sort(sort)
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        Theater.countDocuments(query),
      ]);

      // Filter rooms in returned theaters
      const activeParam = req.query.active;
      if (activeParam !== 'all' && activeParam !== 'false') {
        theaters.forEach(t => {
          if (t.rooms) {
            t.rooms = t.rooms.filter(r => !r.isDeleted);
          }
        });
      }

      return successResponse(res, {
        theaters,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get all theaters error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy chi tiết rạp
  getTheaterById: async (req, res) => {
    try {
      const { id } = req.params;

      const theater = await Theater.findById(id).lean();

      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }
      
      // Filter out deleted rooms if active=true (default) or active=false (deleted only?)
      // Assumption: active param applies to Rooms too? 
      // User said "Mặc định chỉ trả về bản ghi đang hoạt động" for GET API.
      // So if req.query.active !== 'all' and !== 'false', we filter rooms.
      const activeParam = req.query.active;
      if (activeParam !== 'all' && activeParam !== 'false' && theater.rooms) {
        theater.rooms = theater.rooms.filter(r => !r.isDeleted);
      }

      return successResponse(res, theater);
    } catch (error) {
      console.error("Get theater by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy danh sách rạp theo thành phố
  getTheatersByCity: async (req, res) => {
    try {
      const { city } = req.params;

      const theaters = await Theater.find({
        city: { $regex: city, $options: "i" },
        isActive: true,
      })
        .select("-rooms.seatMap")
        .sort({ name: 1 })
        .lean();

      return successResponse(res, theaters);
    } catch (error) {
      console.error("Get theaters by city error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy danh sách thành phố có rạp
  getCities: async (req, res) => {
    try {
      const cities = await Theater.distinct("city");

      return successResponse(res, cities.sort());
    } catch (error) {
      console.error("Get cities error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Tạo rạp mới (Admin)
  createTheater: async (req, res) => {
    try {
      console.log("=== CREATE THEATER START ===");
      console.log("Theater data:", req.body);

      const theaterData = req.body;
      theaterData.createdBy = req.userId;

      // Fix Swagger array issue for coordinates
      if (theaterData.location && theaterData.location.coordinates) {
        if (typeof theaterData.location.coordinates === "object" && !Array.isArray(theaterData.location.coordinates)) {
          theaterData.location.coordinates = Object.values(theaterData.location.coordinates);
        }
      }

      // Ensure rooms is an array (can be empty initially)
      if (!theaterData.rooms) {
        theaterData.rooms = [];
      }

      console.log("Fixed theater data:", theaterData);
      console.log("Creating theater...");
      const newTheater = new Theater(theaterData);
      await newTheater.save();

      console.log("Theater created successfully:", newTheater._id);
      return successResponse(res, newTheater, "Tạo rạp thành công", 201);
    } catch (error) {
      console.error("Create theater error:", error);
      console.error("Error message:", error.message);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  // Cập nhật thông tin rạp (Admin)
  updateTheater: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.location && updateData.location.coordinates) {
        if (typeof updateData.location.coordinates === "object" && !Array.isArray(updateData.location.coordinates)) {
          updateData.location.coordinates = Object.values(updateData.location.coordinates);
        }
      }

      // Không cho update rooms qua endpoint này
      if (updateData.rooms) {
        delete updateData.rooms;
      }

      updateData.updatedBy = req.userId;

      const updatedTheater = await Theater.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!updatedTheater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      return successResponse(res, updatedTheater, "Cập nhật rạp thành công");
    } catch (error) {
      console.error("Update theater error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Xóa rạp (Admin)
  deleteTheater: async (req, res) => {
    try {
      const { id } = req.params;

      const theater = await Theater.findById(id);
      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      //  FIX: Kiểm tra xem rạp có lịch chiếu trong tương lai không
      const Schedule = (await import("../models/schedule.model.js")).default;
      const now = new Date();
      const futureSchedules = await Schedule.countDocuments({
        theater: id,
        showDate: { $gte: now },
        status: { $ne: "Đã hủy" },
      });

      if (futureSchedules > 0) {
        return errorResponse(
          res,
          `Không thể xóa rạp. Rạp còn ${futureSchedules} suất chiếu trong tương lai. Vui lòng hủy tất cả lịch chiếu trước khi xóa rạp.`,
          400
        );
      }

      //  FIX: Kiểm tra rạp có phòng chiếu nào không (optional check)
      if (theater.rooms && theater.rooms.length > 0) {
        return errorResponse(
          res,
          `Không thể xóa rạp. Rạp còn ${theater.rooms.length} phòng chiếu. Vui lòng xóa tất cả phòng chiếu trước khi xóa rạp.`,
          400
        );
      }

      //  FIX: Soft delete thay vì hard delete
      theater.isActive = false; // Mark as inactive too?
      theater.isDeleted = true;
      theater.updatedBy = req.userId;
      await theater.save();

      // Xóa cache
      const redisService = (await import("../services/redis.service.js")).default;
      redisService.invalidateTheaterCache(id.toString()).catch(() => {});

      return successResponse(res, {}, "Xóa rạp thành công");
    } catch (error) {
      console.error("Delete theater error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Thêm phòng chiếu vào rạp (Admin)
  addRoom: async (req, res) => {
    try {
      const { theaterId } = req.params;
      const roomData = req.body;

      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      if (roomData.seatMap && !Array.isArray(roomData.seatMap)) {
        roomData.seatMap = Object.values(roomData.seatMap);
      }

      // Validate seat map
      if (!roomData.seatMap || roomData.seatMap.length === 0) {
        return errorResponse(res, "Sơ đồ ghế không hợp lệ", 400);
      }

      theater.rooms.push(roomData);
      theater.updatedBy = req.userId;
      await theater.save();

      return successResponse(res, theater.rooms[theater.rooms.length - 1], "Thêm phòng chiếu thành công", 201);
    } catch (error) {
      console.error("Add room error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Cập nhật phòng chiếu (Admin)
  updateRoom: async (req, res) => {
    try {
      const { theaterId, roomId } = req.params;
      const updateData = req.body;

      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      if (updateData.seatMap && !Array.isArray(updateData.seatMap)) {
        updateData.seatMap = Object.values(updateData.seatMap);
      }

      const room = theater.rooms.id(roomId);
      if (!room) {
        return errorResponse(res, "Không tìm thấy phòng chiếu", 404);
      }

      // Update room fields
      // Object.assign(room, updateData);
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          room[key] = updateData[key];
        }
      });

      theater.updatedBy = req.userId;
      await theater.save();

      return successResponse(res, room, "Cập nhật phòng chiếu thành công");
    } catch (error) {
      console.error("Update room error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Xóa phòng chiếu (Admin)
  deleteRoom: async (req, res) => {
    try {
      const { theaterId, roomId } = req.params;

      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return errorResponse(res, "Không tìm thấy rạp", 404);
      }

      // TODO: Kiểm tra phòng có lịch chiếu trong tương lai không

      //  FIX: Soft delete room
      // theater.rooms.pull(roomId);
      const room = theater.rooms.id(roomId);
      if (room) {
        room.isDeleted = true;
      } else {
        return errorResponse(res, "Không tìm thấy phòng chiếu", 404);
      }
      
      theater.updatedBy = req.userId;
      await theater.save();

      return successResponse(res, {}, "Xóa phòng chiếu thành công");
    } catch (error) {
      console.error("Delete room error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Cập nhật nhiều ghế cùng lúc
  updateMultipleSeats: async (req, res) => {
    try {
      console.log("BODY:", req.body);

      let { seats, seatMap } = req.body;

      // Convert object {0:{},1:{}} -> array
      if (seats && !Array.isArray(seats)) {
        seats = Object.values(seats);
      }

      if (seatMap && !Array.isArray(seatMap)) {
        seatMap = Object.values(seatMap);
      }

      const list = seats || seatMap;

      if (!Array.isArray(list) || list.length === 0) {
        return errorResponse(res, "Danh sách ghế không hợp lệ", 400);
      }

      const { theaterId, roomId } = req.params;

      const theater = await Theater.findById(theaterId);
      if (!theater) return errorResponse(res, "Không tìm thấy rạp", 404);

      const room = theater.rooms.id(roomId);
      if (!room) return errorResponse(res, "Không tìm thấy phòng chiếu", 404);

      list.forEach((s) => {
        const seat = room.seatMap.find((item) => item.seatNumber === s.seatNumber);
        if (!seat) return;

        Object.keys(s).forEach((key) => {
          if (key !== "seatNumber" && s[key] !== undefined) {
            seat[key] = s[key];
          }
        });
      });

      theater.updatedBy = req.userId;
      await theater.save();

      return successResponse(res, list, "Cập nhật nhiều ghế thành công");
    } catch (error) {
      console.error("Update multiple seats error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },
};

export default theaterController;
