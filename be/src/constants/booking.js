/**
 *  FIX #14: Booking constants để thay thế magic numbers
 */
export const BOOKING_CONSTANTS = {
  // Seat hold duration
  SEAT_HOLD_DURATION_MS: 10 * 60 * 1000, // 10 phút

  // Booking expiry
  BOOKING_EXPIRY_MS: 15 * 60 * 1000, // 15 phút

  // QR code expiry
  QR_CODE_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 giờ

  // Cancellation policies
  CANCELLATION_DEADLINE_HOURS: 24, // 24 giờ trước suất chiếu
  REFUND_FULL_HOURS: 48, // Hoàn tiền 100% nếu hủy trước 48h
  REFUND_PARTIAL_HOURS: 24, // Hoàn tiền 70% nếu hủy trước 24h
  REFUND_PARTIAL_PERCENTAGE: 0.7, // 70%

  // Check-in window
  CHECK_IN_WINDOW_BEFORE_MINUTES: 120, // 2 giờ trước
  CHECK_IN_WINDOW_AFTER_MINUTES: 30, // 30 phút sau khi bắt đầu

  // Limits
  MAX_SEATS_PER_BOOKING: 10,
  MAX_PRODUCTS_PER_BOOKING: 20,
  MAX_PRODUCT_QUANTITY: 20,

  // Cache TTL
  BOOKING_CACHE_TTL: 900, // 15 phút
  SCHEDULE_CACHE_TTL: 300, // 5 phút

  // Rate limits
  BOOKING_RATE_LIMIT: 10, // 10 bookings per 15 minutes
  PAYMENT_RATE_LIMIT: 5, // 5 payment attempts per 5 minutes
  QR_SCAN_RATE_LIMIT: 30, // 30 scans per minute
};

export const BOOKING_STATUS = {
  PENDING_PAYMENT: "Chờ thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  USED: "Đã sử dụng",
  REFUNDED: "Đã hoàn tiền",
};

export const SEAT_TYPES = {
  STANDARD: "Thường",
  VIP: "VIP",
  COUPLE: "Ghế đôi",
};

export const PAYMENT_METHODS = {
  VNPAY: "VNPay",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
  CASH: "Tiền mặt",
  CARD: "Thẻ",
};

export const PAYMENT_STATUS = {
  PENDING: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn tất",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};
