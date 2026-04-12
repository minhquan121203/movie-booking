import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const userController = {
  // Hàm tạo admin mới dành cho superadmin
  createUser: async (req, res) => {
    try {
      const { email, password, confirmPassword, fullName, role, phoneNumber, assignedTheater, assignedCity } = req.body;

      // Check quyền: Chỉ Super Admin mới tạo được Admin vùng
      if (role === 'admin' && req.user.role !== 'super-admin') {
        return errorResponse(res, "Chỉ Super-Admin mới có quyền bổ nhiệm Quản trị vùng!", 403);
      }

      if (password !== confirmPassword) {
        return errorResponse(res, "Mật khẩu nhập lại không khớp!", 400);
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return errorResponse(res, "Email này đã được sử dụng", 400);
      }

      const newUser = new User({
        email: email.toLowerCase(),
        password, // Model sẽ tự động hash (pre-save hook)
        fullName,
        role: role || 'staff',
        phoneNumber,
        assignedTheater,
        assignedCity,
        authProviders: ['local'],
        isEmailVerified: true
      });

      await newUser.save();
      const userResponse = newUser.toObject();
      delete userResponse.password;

      return successResponse(res, userResponse, "Bổ nhiệm nhân sự thành công!");
    } catch (error) {
      console.error("Create user error:", error);
      return errorResponse(res, "Lỗi hệ thống khi tạo người dùng", 500);
    }
  },

  // Cập nhật role & khu vực (Để Super Admin có thể đổi vùng cho Admin)
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, permissions, assignedCity, fullName, phoneNumber } = req.body;
      const currentUserRole = req.user.role; // Lấy role của người đang thực hiện lệnh sửa

      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      // Chỉ Super Admin mới được sửa thông tin của Admin khác hoặc nâng cấp Role
      if (user.role === 'admin' && currentUserRole !== 'super-admin') {
        return errorResponse(res, "Bạn không có quyền chỉnh sửa tài khoản Quản trị viên này!", 403);
      }

      if (fullName) user.fullName = fullName;
      if (phoneNumber) user.phoneNumber = phoneNumber;

      if (role) user.role = role;
      if (permissions) user.permissions = permissions;

      if (assignedCity !== undefined) {
        user.assignedCity = assignedCity;
      }

      await user.save();

      return successResponse(res, user, "Cập nhật thông tin và quyền hạn thành column thành công!");
    } catch (error) {
      console.error("Update user role error:", error);
      return errorResponse(res, "Lỗi server khi cập nhật", 500);
    }
  },

  // Xóa user (Super Admin)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Không cho xóa chính mình
      if (id === req.userId) {
        return errorResponse(res, "Không thể xóa chính mình", 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      user.isDeleted = true;
      user.isActive = false; // Disable login
      await user.save();
      // const user = await User.findByIdAndDelete(id);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      return successResponse(res, {}, "Xóa người dùng thành công");
    } catch (error) {
      console.error("Delete user error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Cập nhật profile
  updateProfile: async (req, res) => {
    try {
      const { fullName, phoneNumber, profilePicture } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      if (fullName) user.fullName = fullName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (profilePicture) user.profilePicture = profilePicture;

      await user.save();

      return successResponse(res, user, "Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Update profile error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy điểm loyalty
  getLoyaltyPoints: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("loyaltyPoints membershipLevel");

      return successResponse(res, {
        loyaltyPoints: user.loyaltyPoints,
        membershipLevel: user.membershipLevel,
      });
    } catch (error) {
      console.error("Get loyalty points error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Verification CCCD Demo
  verifyAge: async (req, res) => {
    try {
      const { demo_cccd } = req.body;

      if (!demo_cccd) {
          return errorResponse(res, "Vui lòng nhập Demo CCCD", 400);
      }

      // Random verified age from 10 to 100
      const verifiedLevel = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
      
      const user = await User.findById(req.userId);
      if (!user) {
          return errorResponse(res, "Người dùng không tồn tại", 404);
      }

      user.verified_age_level = verifiedLevel;
      user.age_verified_at = new Date();
      await user.save();

      return successResponse(res, {
          verified_age_level: verifiedLevel,
          age_verified_at: user.age_verified_at
      }, "Xác minh độ tuổi thành công");
      
    } catch (error) {
       console.error("Verify age error:", error);
       return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Get Verified Age Status
  getAgeStatus: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("verified_age_level age_verified_at");
      if (!user) {
        return errorResponse(res, "Người dùng không tồn tại", 404);
      }

      return successResponse(res, {
        verified_age_level: user.verified_age_level,
        age_verified_at: user.age_verified_at,
        is_verified: !!user.verified_age_level
      });
    } catch (error) {
       console.error("Get age status error:", error);
       return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy thống kê chi tiêu của chính user (Customer)
  getSpendingStats: async (req, res) => {
    try {
      const userId = req.userId;

      // Calculate total spending from bookings
      const bookingStats = await Booking.aggregate([
        {
          $match: {
            customer: new mongoose.Types.ObjectId(userId),
            status: { $in: ["completed", "confirmed", "Hoàn tất", "Đã xác nhận"] },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$totalAmount" },
            completedBookings: {
              $sum: {
                $cond: [{ $in: ["$status", ["completed", "Hoàn tất"]] }, 1, 0],
              },
            },
            cancelledBookings: {
              $sum: {
                $cond: [{ $in: ["$status", ["cancelled", "Đã hủy"]] }, 1, 0],
              },
            },
            totalBookings: { $sum: 1 },
          },
        },
      ]);

      const spending =
        bookingStats.length > 0
          ? bookingStats[0]
          : { totalSpent: 0, completedBookings: 0, cancelledBookings: 0, totalBookings: 0 };

      return successResponse(res, {
        totalSpent: spending.totalSpent || 0,
        totalBookings: spending.totalBookings || 0,
        completedBookings: spending.completedBookings || 0,
        cancelledBookings: spending.cancelledBookings || 0,
      });
    } catch (error) {
      console.error("Get spending stats error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy tất cả users (Admin)
  getAllUsers: async (req, res) => {
    try {
      const { role, page = 1, limit = 20, search } = req.query;
      
      const query = {
        ...getDeleteFilter(req.query)
      };

      // Support filtering by business status isActive (if provided in query)
      // Note: User model has isActive field
      if (req.query.isActive !== undefined) {
          query.isActive = req.query.isActive === 'true';
      }
      if (role) query.role = role;
      if (search) {
        query.$or = [{ fullName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
      }

      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find(query)
          .select("-password")
          .populate({
            path: "staffInfo.assignedTheater",
            select: "name",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments(query),
      ]);

      return successResponse(res, {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy chi tiết user (Admin)
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-password").lean();
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      // Calculate total spending from bookings
      const bookingStats = await Booking.aggregate([
        {
          $match: {
            customer: new mongoose.Types.ObjectId(id),
            status: { $in: ["completed", "confirmed", "Hoàn tất", "Đã xác nhận"] },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$totalAmount" },
            completedBookings: {
              $sum: {
                $cond: [{ $in: ["$status", ["completed", "Hoàn tất"]] }, 1, 0],
              },
            },
            cancelledBookings: {
              $sum: {
                $cond: [{ $in: ["$status", ["cancelled", "Đã hủy"]] }, 1, 0],
              },
            },
            totalBookings: { $sum: 1 },
          },
        },
      ]);

      const spending =
        bookingStats.length > 0
          ? bookingStats[0]
          : { totalSpent: 0, completedBookings: 0, cancelledBookings: 0, totalBookings: 0 };

      return successResponse(res, {
        ...user,
        spending: {
          totalSpent: spending.totalSpent || 0,
          totalBookings: spending.totalBookings || 0,
          completedBookings: spending.completedBookings || 0,
          cancelledBookings: spending.cancelledBookings || 0,
        },
      });
    } catch (error) {
      console.error("Get user by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default userController;
