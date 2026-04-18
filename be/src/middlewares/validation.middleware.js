import mongoose from "mongoose";
import { errorResponse } from "../utils/response.js";

/**
 *  FIX #5: Validation middleware cho booking
 */
export const validateBookingInput = (req, res, next) => {
  let { scheduleId, seats, products, voucherCode } = req.body;

  // Validate scheduleId
  if (!scheduleId) {
    return errorResponse(res, "Schedule ID là bắt buộc", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
    return errorResponse(res, "Schedule ID không hợp lệ", 400);
  }

  // Fix Swagger array issue - convert object to array if needed
  if (seats && typeof seats === "object" && !Array.isArray(seats)) {
    seats = Object.values(seats);
    req.body.seats = seats; // Update req.body
  }

  // Validate seats
  if (!seats || !Array.isArray(seats)) {
    return errorResponse(res, "Seats phải là một array", 400);
  }

  if (seats.length === 0) {
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

    if (seat.seatNumber.length > 10) {
      return errorResponse(res, "Số ghế không hợp lệ", 400);
    }
  }

  // Fix Swagger array issue for products
  if (products && typeof products === "object" && !Array.isArray(products)) {
    products = Object.values(products);
    req.body.products = products;
  }

  // Validate products if provided
  if (products) {
    if (!Array.isArray(products)) {
      return errorResponse(res, "Products phải là một array", 400);
    }

    if (products.length > 20) {
      return errorResponse(res, "Không thể đặt quá 20 loại sản phẩm", 400);
    }

    for (const item of products) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        return errorResponse(res, "Product ID không hợp lệ", 400);
      }

      if (!item.quantity || typeof item.quantity !== "number") {
        return errorResponse(res, "Số lượng sản phẩm phải là số", 400);
      }

      if (item.quantity < 1 || item.quantity > 20) {
        return errorResponse(res, "Số lượng sản phẩm không hợp lệ (1-20)", 400);
      }

      if (!Number.isInteger(item.quantity)) {
        return errorResponse(res, "Số lượng sản phẩm phải là số nguyên", 400);
      }
    }
  }

  // Validate voucherCode if provided
  if (voucherCode) {
    if (typeof voucherCode !== "string") {
      return errorResponse(res, "Voucher code phải là string", 400);
    }

    if (voucherCode.length > 50) {
      return errorResponse(res, "Voucher code quá dài", 400);
    }

    // Check for SQL injection patterns
    if (/[;<>'"\\]/.test(voucherCode)) {
      return errorResponse(res, "Voucher code chứa ký tự không hợp lệ", 400);
    }
  }

  next();
};

/**
 *  FIX #5: Validation cho auth
 */
export const validateRegisterInput = (req, res, next) => {
  const { email, password, fullName, username, phoneNumber } = req.body;

  // Email validation
  if (!email) {
    return errorResponse(res, "Email là bắt buộc", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return errorResponse(res, "Email không hợp lệ", 400);
  }

  if (email.length > 100) {
    return errorResponse(res, "Email quá dài", 400);
  }

  // Password validation
  if (!password) {
    return errorResponse(res, "Mật khẩu là bắt buộc", 400);
  }

  if (password.length < 6) {
    return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự", 400);
  }

  if (password.length > 100) {
    return errorResponse(res, "Mật khẩu quá dài", 400);
  }

  // Full name validation
  if (!fullName) {
    return errorResponse(res, "Họ tên là bắt buộc", 400);
  }

  if (fullName.length < 2) {
    return errorResponse(res, "Họ tên phải có ít nhất 2 ký tự", 400);
  }

  if (fullName.length > 100) {
    return errorResponse(res, "Họ tên quá dài", 400);
  }

  // Username validation (optional)
  if (username) {
    if (username.length < 3 || username.length > 30) {
      return errorResponse(res, "Username phải có từ 3-30 ký tự", 400);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return errorResponse(res, "Username chỉ chứa chữ, số và dấu gạch dưới", 400);
    }
  }

  // Phone number validation (optional)
  if (phoneNumber) {
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      return errorResponse(res, "Số điện thoại không hợp lệ", 400);
    }
  }

  next();
};

/**
 *  FIX #5: Validation cho login
 */
export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return errorResponse(res, "Email là bắt buộc", 400);
  }

  if (!password) {
    return errorResponse(res, "Mật khẩu là bắt buộc", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return errorResponse(res, "Email không hợp lệ", 400);
  }

  next();
};

/**
 *  FIX #5: Validate ObjectId
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return errorResponse(res, `${paramName} là bắt buộc`, 400);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, `${paramName} không hợp lệ`, 400);
    }

    next();
  };
};

/**
 *  FIX #5: Sanitize input để prevent injection
 */
export const sanitizeInput = (req, res, next) => {
  // Remove any potential MongoDB operators from query params
  const sanitizeObject = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    const sanitized = {};
    for (const key in obj) {
      // Remove keys starting with $
      if (key.startsWith("$")) {
        continue;
      }

      if (typeof obj[key] === "object") {
        sanitized[key] = sanitizeObject(obj[key]);
      } else if (typeof obj[key] === "string") {
        // Basic XSS prevention
        sanitized[key] = obj[key].replace(/<script[^>]*>.*?<\/script>/gi, "");
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };

  // Sanitize body
  req.body = sanitizeObject(req.body);

  // Sanitize query params (can't reassign req.query, must modify in place)
  const sanitizedQuery = sanitizeObject(req.query);
  for (const key in req.query) {
    delete req.query[key];
  }
  Object.assign(req.query, sanitizedQuery);

  next();
};
