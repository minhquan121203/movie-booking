import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const userController = {
  // Hàm tạo admin mới dành cho superadmin
  createUser: async (req, res) => {
    try {
      const {
        email,
        password,
        confirmPassword, // 🔥 Lấy thêm confirmPassword từ FE gửi lên
        fullName,
        role,
        phoneNumber,
        assignedTheater,
        assignedCity      // 🔥 Lấy thêm khu vực quản lý
      } = req.body;

      // 1. KIỂM TRA QUYỀN (Vệ sĩ)
      const currentUserRole = req.user.role;
      if (role === 'admin' && currentUserRole !== 'super-admin') {
        return res.status(403).json({ success: false, message: "Chỉ Super-Admin mới có quyền tạo Quản trị vùng!" });
      }

      // 2. 🔥 KIỂM TRA MẬT KHẨU NHẬP LẠI
      if (password !== confirmPassword) {
        return errorResponse(res, "Mật khẩu nhập lại không khớp!", 400);
      }

      // 3. Kiểm tra email tồn tại
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return errorResponse(res, "Email này đã được sử dụng trong hệ thống", 400);
      }

      // ⚠️ LƯU Ý CỰC QUAN TRỌNG:
      // Fen NÊN XÓA đoạn mã hóa mật khẩu (bcrypt) thủ công ở đây đi.
      // LÝ DO: Trong file user.model.js của fen đã có "pre-save hook" tự động hash rồi.
      // Nếu Fen hash ở đây 1 lần, rồi Model hash thêm 1 lần nữa => Pass bị sai, không login được.

      // 4. Tạo User mới
      const newUser = new User({
        email: email.toLowerCase(),
        password, // 🔥 Truyền mật khẩu thô vào đây, Model sẽ tự lo phần hash
        fullName,
        role: role || 'staff',
        phoneNumber,
        assignedTheater,
        assignedCity, // 🔥 LƯU KHU VỰC QUẢN LÝ (VÙNG)
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
      const { role, permissions, assignedCity } = req.body; // 🔥 Thêm assignedCity vào đây

      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      if (role) user.role = role;
      if (permissions) user.permissions = permissions;
      if (assignedCity !== undefined) user.assignedCity = assignedCity; // 🔥 Cho phép đổi vùng

      await user.save();

      return successResponse(res, user, "Cập nhật quyền hạn và khu vực thành công");
    } catch (error) {
      console.error("Update user role error:", error);
      return errorResponse(res, "Lỗi server", 500);
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
