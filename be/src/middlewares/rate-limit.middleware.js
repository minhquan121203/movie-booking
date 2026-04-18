import rateLimit from "express-rate-limit";

/**
 *  FIX #9: Rate limiting cho booking operations
 */
export const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 bookings per 15 minutes
  message: "Quá nhiều lần đặt vé từ IP này. Vui lòng thử lại sau 15 phút",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req, res) => {
    // Use userId if authenticated, otherwise let default IP handler work
    return req.userId;
  },
});

/**
 *  FIX #9: Rate limiting cho payment confirmation
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5, // 5 payment attempts per 5 minutes
  message: "Quá nhiều lần xác nhận thanh toán. Vui lòng thử lại sau",
  keyGenerator: (req, res) => {
    return req.userId;
  },
});

/**
 *  FIX #9: Rate limiting cho QR scanning
 */
export const qrScanRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 30, // 30 scans per minute
  message: "Quá nhiều lần quét QR. Vui lòng thử lại sau",
  keyGenerator: (req, res) => {
    return req.userId;
  },
});

/**
 *  FIX #9: Rate limiting cho password reset
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // 3 attempts per hour
  message: "Quá nhiều lần yêu cầu reset mật khẩu. Vui lòng thử lại sau 1 giờ",
  keyGenerator: (req, res) => {
    return req.body.email;
  },
});

/**
 *  FIX #9: Rate limiting cho voucher verification
 */
export const voucherRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 20, // 20 voucher checks per 5 minutes
  message: "Quá nhiều lần kiểm tra voucher. Vui lòng thử lại sau",
  keyGenerator: (req, res) => {
    return req.userId;
  },
});

/**
 *  FIX #9: Rate limiting cho review creation
 */
export const reviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // 5 reviews per hour
  message: "Quá nhiều đánh giá. Vui lòng thử lại sau",
  keyGenerator: (req, res) => {
    return req.userId;
  },
});

/**
 *  FIX #9: Strict rate limiting cho admin operations
 */
export const adminOperationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 50, // 50 operations per minute
  message: "Quá nhiều operations. Vui lòng thử lại sau",
  keyGenerator: (req, res) => {
    return req.userId;
  },
});
