/**
 * Custom Error Classes for consistent error handling
 */

export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT_ERROR");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR");
  }
}

export class PaymentError extends AppError {
  constructor(message = "Payment processing failed") {
    super(message, 402, "PAYMENT_ERROR");
  }
}

export class BookingError extends AppError {
  constructor(message = "Booking operation failed") {
    super(message, 400, "BOOKING_ERROR");
  }
}

export class SeatUnavailableError extends BookingError {
  constructor(seatNumbers = []) {
    const message =
      seatNumbers.length > 0 ? `Seats ${seatNumbers.join(", ")} are not available` : "Selected seats are not available";
    super(message);
    this.code = "SEAT_UNAVAILABLE";
    this.seatNumbers = seatNumbers;
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName = "Product") {
    super(`${productName} is out of stock`, 400, "INSUFFICIENT_STOCK");
  }
}

export class VoucherError extends AppError {
  constructor(message = "Voucher is invalid") {
    super(message, 400, "VOUCHER_ERROR");
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.userId,
    timestamp: new Date().toISOString(),
  });

  // Handle known errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
        ...(err.seatNumbers && { seatNumbers: err.seatNumbers }),
      },
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors,
      },
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ERROR",
        message: `${field} already exists`,
        field,
      },
    });
  }

  // Handle Mongoose cast errors
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid ID format",
        field: err.path,
      },
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token expired",
      },
    });
  }

  // Handle Multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: err.message,
      },
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
  });
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.originalUrl} not found`,
    },
  });
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  BookingError,
  SeatUnavailableError,
  InsufficientStockError,
  VoucherError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
