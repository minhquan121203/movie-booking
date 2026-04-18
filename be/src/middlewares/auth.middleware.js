import jwt from "jsonwebtoken";
import ShiftAssignment from "../models/shiftAssignment.model.js";
import User from "../models/user.model.js";
import { errorResponse } from "../utils/response.js";

// Middleware xác thực token
export const authenticateToken = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return errorResponse(res, "Không tìm thấy token xác thực", 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user còn tồn tại
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return errorResponse(res, "Token không hợp lệ", 401);
    }

    // Attach user info vào request
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, "Token đã hết hạn", 401);
    }
    if (error.name === "JsonWebTokenError") {
      return errorResponse(res, "Token không hợp lệ", 401);
    }
    console.error("Auth middleware error:", error);
    return errorResponse(res, "Lỗi xác thực", 500);
  }
};

// Middleware kiểm tra role (dùng sau authenticateToken)
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return errorResponse(res, "Chưa xác thực", 401);
    }

    if (!allowedRoles.includes(req.userRole)) {
      return errorResponse(res, "Bạn không có quyền truy cập", 403);
    }

    next();
  };
};

// Middleware cho optional authentication (không bắt buộc đăng nhập)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user) {
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Không báo lỗi, chỉ không có thông tin user
    next();
  }
};

// Middleware kiểm tra quyền theo permissions cụ thể
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Chưa xác thực", 401);
    }

    // Super admin có tất cả quyền
    if (req.userRole === "super-admin") {
      return next();
    }

    // Kiểm tra permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return errorResponse(res, `Bạn không có quyền ${permission}`, 403);
    }

    next();
  };
};

// Middleware bắt buộc staff phải check-in trước khi thực hiện thao tác
export const requireActiveShift = async (req, res, next) => {
  try {
    // Admin và manager không cần check-in
    if (req.userRole === "admin" || req.userRole === "manager" || req.userRole === "super-admin") {
      return next();
    }

    // Staff phải có active shift assignment
    const activeAssignment = await ShiftAssignment.findOne({
      userId: req.userId,
      status: "active",
    })
      .populate("workScheduleId")
      .lean();

    if (!activeAssignment) {
      return errorResponse(res, "Bạn phải check-in ca làm việc trước khi thực hiện thao tác này", 403);
    }

    // Kiểm tra xem ca làm việc có đang trong thời gian không (optional, có thể bỏ)
    const now = new Date();
    if (activeAssignment.workScheduleId) {
      const schedule = activeAssignment.workScheduleId;
      if (now < schedule.startDateTime || now > schedule.endDateTime) {
        return errorResponse(res, "Ca làm việc của bạn chưa bắt đầu hoặc đã kết thúc", 403);
      }
    }

    // Attach assignment info vào request để controller có thể sử dụng
    req.activeShift = activeAssignment;

    next();
  } catch (error) {
    console.error("requireActiveShift middleware error:", error);
    return errorResponse(res, "Lỗi kiểm tra ca làm việc", 500);
  }
};
