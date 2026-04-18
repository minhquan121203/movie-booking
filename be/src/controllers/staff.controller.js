import Booking from "../models/booking.model.js";
import Schedule from "../models/schedule.model.js";
import Theater from "../models/theater.model.js";
import User from "../models/user.model.js";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const staffController = {
  // ============================================
  // STAFF PROFILE MANAGEMENT
  // ============================================

  // Get staff profile
  getProfile: async (req, res) => {
    try {
      const staff = await User.findById(req.userId).select("-password");

      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể truy cập");
      }

      // Populate theater if assigned
      if (staff.staffInfo?.assignedTheater) {
        await staff.populate("staffInfo.assignedTheater", "name address city");
      }

      return successResponse(res, { staff }, "Lấy thông tin nhân viên thành công");
    } catch (error) {
      console.error("Get staff profile error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Update staff profile
  updateProfile: async (req, res) => {
    try {
      const { fullName, phoneNumber, profilePicture } = req.body;

      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể cập nhật");
      }

      if (fullName) staff.fullName = fullName;
      if (phoneNumber) staff.phoneNumber = phoneNumber;
      if (profilePicture) staff.profilePicture = profilePicture;

      await staff.save();

      return successResponse(res, { staff }, "Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Update staff profile error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get assigned theater info
  getAssignedTheater: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);

      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể truy cập");
      }

      if (!staff.staffInfo?.assignedTheater) {
        throw new NotFoundError("Chưa được phân công rạp");
      }

      // Populate theater
      await staff.populate("staffInfo.assignedTheater");

      return successResponse(res, { theater: staff.staffInfo.assignedTheater }, "Lấy thông tin rạp thành công");
    } catch (error) {
      console.error("Get assigned theater error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // ============================================
  // STAFF DASHBOARD
  // ============================================

  // Get staff dashboard data
  getDashboard: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);

      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể truy cập");
      }

      // Populate theater if assigned
      if (staff.staffInfo?.assignedTheater) {
        await staff.populate("staffInfo.assignedTheater");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const theaterName = staff.staffInfo?.assignedTheater?.name;
      const theaterId = staff.staffInfo?.assignedTheater?._id;

      // Get today's bookings at assigned theater
      const todayBookings = theaterName
        ? await Booking.countDocuments({
            theaterName: theaterName,
            createdAt: { $gte: today },
            status: { $in: ["Hoàn tất", "Chờ thanh toán"] },
          })
        : 0;

      // Get today's revenue
      let todayRevenue = 0;
      if (theaterName) {
        const revenueResult = await Booking.aggregate([
          {
            $match: {
              theaterName: theaterName,
              createdAt: { $gte: today },
              status: "Hoàn tất",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ]);
        todayRevenue = revenueResult[0]?.total || 0;
      }

      // Get today's schedules
      const todaySchedules = theaterId
        ? await Schedule.countDocuments({
            theater: theaterId,
            showDate: {
              $gte: today,
              $lt: tomorrow,
            },
          })
        : 0;

      const dashboardData = {
        staff: {
          name: staff.fullName,
          position: staff.staffInfo?.position || "N/A",
          shift: staff.staffInfo?.shift || "N/A",
          theater: theaterName || "Chưa phân công",
        },
        today: {
          bookings: todayBookings,
          revenue: todayRevenue,
          schedules: todaySchedules,
        },
      };

      return successResponse(res, dashboardData, "Lấy dashboard thành công");
    } catch (error) {
      console.error("Get staff dashboard error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // ============================================
  // STAFF PERMISSIONS CHECK
  // ============================================

  // Check if staff has specific permission
  hasPermission: async (req, res) => {
    try {
      const { permission } = req.params;

      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        return successResponse(res, { hasPermission: false });
      }

      const hasPermission =
        staff.staffInfo?.permissions?.includes(permission) ||
        staff.staffInfo?.position === "manager" ||
        staff.staffInfo?.position === "supervisor";

      return successResponse(res, { hasPermission });
    } catch (error) {
      console.error("Check permission error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // ============================================
  // ADMIN STAFF MANAGEMENT
  // ============================================

  // Assign theater to staff (Admin only)
  assignTheater: async (req, res) => {
    try {
      const { staffId, theaterId } = req.body;

      // Validate input
      if (!staffId || !theaterId) {
        return errorResponse(res, "staffId và theaterId là bắt buộc", 400);
      }

      // Check if staff exists
      const staff = await User.findById(staffId);
      if (!staff || staff.role !== "staff") {
        throw new NotFoundError("Nhân viên không tồn tại hoặc không phải nhân viên");
      }

      // Check if theater exists
      const theater = await Theater.findById(theaterId);
      if (!theater) {
        throw new NotFoundError("Rạp chiếu không tồn tại");
      }

      // Assign theater to staff
      staff.staffInfo.assignedTheater = theaterId;
      await staff.save();

      // Return updated staff with theater info
      await staff.populate("staffInfo.assignedTheater", "name address city");

      return successResponse(
        res,
        { staff },
        `Đã gán rạp "${theater.name}" cho nhân viên "${staff.fullName}" thành công`
      );
    } catch (error) {
      console.error("Assign theater error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get all staff with theater assignments
  getAllStaff: async (req, res) => {
    try {
      const { theaterId } = req.query;

      let query = { role: "staff", ...getDeleteFilter(req.query) };
      if (theaterId) {
        query["staffInfo.assignedTheater"] = theaterId;
      }

      const staffList = await User.find(query)
        .select("-password")
        .populate("staffInfo.assignedTheater", "name address city")
        .sort({ fullName: 1 });

      return successResponse(res, { staff: staffList, total: staffList.length }, "Lấy danh sách nhân viên thành công");
    } catch (error) {
      console.error("Get all staff error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Remove theater assignment from staff
  removeTheaterAssignment: async (req, res) => {
    try {
      const { staffId } = req.params;

      const staff = await User.findById(staffId);
      if (!staff || staff.role !== "staff") {
        throw new NotFoundError("Nhân viên không tồn tại");
      }

      const theaterName = staff.staffInfo?.assignedTheater?.name || "không xác định";

      // Remove theater assignment
      staff.staffInfo.assignedTheater = null;
      await staff.save();

      return successResponse(res, { staff }, `Đã hủy gán rạp cho nhân viên "${staff.fullName}" thành công`);
    } catch (error) {
      console.error("Remove theater assignment error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get staff by theater
  getStaffByTheater: async (req, res) => {
    try {
      const { theaterId } = req.params;

      // Check if theater exists
      const theater = await Theater.findById(theaterId);
      if (!theater) {
        throw new NotFoundError("Rạp chiếu không tồn tại");
      }

      const staffList = await User.find({
        role: "staff",
        "staffInfo.assignedTheater": theaterId,
        ...getDeleteFilter(req.query),
      })
        .select("-password")
        .populate("staffInfo.assignedTheater", "name address city")
        .sort({ fullName: 1 });

      return successResponse(
        res,
        { staff: staffList, total: staffList.length, theater: theater.name },
        `Lấy danh sách nhân viên tại rạp "${theater.name}" thành công`
      );
    } catch (error) {
      console.error("Get staff by theater error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // ============================================
  // ADMIN: CREATE STAFF ACCOUNT
  // ============================================
  createStaffAccount: async (req, res) => {
    try {
      const { email, password, fullName, phoneNumber, assignedTheater, permissions } = req.body;

      // Validation
      if (!email || !password || !fullName) {
        return errorResponse(res, "Email, mật khẩu và họ tên là bắt buộc", 400);
      }

      // Check email exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, "Email đã được sử dụng", 400);
      }

      // Create staff account
      const staff = await User.create({
        email,
        password,
        fullName,
        phoneNumber,
        role: "staff",
        staffInfo: {
          assignedTheater: assignedTheater || null,
          isActive: true,
          permissions: permissions || [],
        },
        isActive: true,
        isEmailVerified: false,
      });

      // Remove password from response
      const staffResponse = staff.toObject();
      delete staffResponse.password;

      return successResponse(res, staffResponse, "Tạo tài khoản nhân viên thành công", 201);
    } catch (error) {
      console.error("Create staff account error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },
};

export default staffController;
