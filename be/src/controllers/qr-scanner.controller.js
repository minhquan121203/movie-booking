import qrScannerService from "../services/qr-scanner.service.js";
import catchAsync from "../middlewares/catchAsync.middleware.js";
import { successResponse } from "../utils/response.js";

// Validate QR code
const validateQR = catchAsync(async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ message: "QR data is required" });
  }

  const validation = await qrScannerService.validateQRCode(qrData);
  successResponse(res, validation, "QR code validated");
});

// Quick validate (for real-time camera feed)
const quickValidate = catchAsync(async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ message: "QR data is required" });
  }

  const validation = await qrScannerService.quickValidate(qrData);
  successResponse(res, validation, "Quick validation complete");
});

// Process check-in from QR scan
const scanCheckIn = catchAsync(async (req, res) => {
  const { qrData, theaterId } = req.body;
  const staffId = req.user._id;

  if (!qrData || !theaterId) {
    return res.status(400).json({ message: "QR data and theater ID are required" });
  }

  const deviceInfo = {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip || req.connection.remoteAddress,
    deviceType: req.body.deviceType || "camera-scanner",
  };

  const result = await qrScannerService.processCheckIn(qrData, staffId, theaterId, deviceInfo);
  successResponse(res, result, result.message);
});

// Generate QR code for booking
const generateQR = catchAsync(async (req, res) => {
  const { bookingId } = req.params;

  const qrCode = await qrScannerService.generateQRCode(bookingId);
  successResponse(res, qrCode, "QR code generated successfully");
});

// Verify booking code (alternative method)
const verifyBookingCode = catchAsync(async (req, res) => {
  const { bookingCode, theaterId } = req.body;

  if (!bookingCode || !theaterId) {
    return res.status(400).json({ message: "Booking code and theater ID are required" });
  }

  const verification = await qrScannerService.verifyBookingCode(bookingCode, theaterId);
  successResponse(res, verification, "Booking code verified");
});

// Process check-in by booking code
const checkInByCode = catchAsync(async (req, res) => {
  const { bookingCode, theaterId } = req.body;
  const staffId = req.user._id;

  if (!bookingCode || !theaterId) {
    return res.status(400).json({ message: "Booking code and theater ID are required" });
  }

  const verification = await qrScannerService.verifyBookingCode(bookingCode, theaterId);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      message: verification.message,
      data: verification,
    });
  }

  const deviceInfo = {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip || req.connection.remoteAddress,
    deviceType: "manual-code-entry",
  };

  const result = await qrScannerService.processCheckIn(verification.booking.qrCodeData, staffId, theaterId, deviceInfo);

  successResponse(res, result, result.message);
});

// Get scan history
const getScanHistory = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  const { startDate, endDate, staff, entryMethod, verified } = req.query;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const filters = {};
  if (staff) filters.staff = staff;
  if (entryMethod) filters.entryMethod = entryMethod;
  if (verified !== undefined) filters.verified = verified === "true";

  const history = await qrScannerService.getScanHistory(theaterId, start, end, filters);
  successResponse(res, history, "Scan history retrieved successfully");
});

// Get scan statistics
const getScanStatistics = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const stats = await qrScannerService.getScanStatistics(theaterId, start, end);
  successResponse(res, stats, "Scan statistics retrieved successfully");
});

// Bulk check-in
const bulkCheckIn = catchAsync(async (req, res) => {
  const { bookingIds, theaterId } = req.body;
  const staffId = req.user._id;

  if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({ message: "Booking IDs array is required" });
  }

  if (!theaterId) {
    return res.status(400).json({ message: "Theater ID is required" });
  }

  const deviceInfo = {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip || req.connection.remoteAddress,
    deviceType: "bulk-scanner",
  };

  const result = await qrScannerService.bulkCheckIn(bookingIds, staffId, theaterId, deviceInfo);
  successResponse(res, result, "Bulk check-in completed");
});

// Camera stream endpoint (for WebRTC or similar)
const initCameraStream = catchAsync(async (req, res) => {
  const { theaterId } = req.body;
  const staffId = req.user._id;

  // Return configuration for camera stream
  const config = {
    theaterId,
    staffId,
    streamId: `stream_${Date.now()}_${staffId}`,
    settings: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      facingMode: "environment", // Use back camera on mobile
      scanInterval: 500, // ms between scans
    },
    endpoints: {
      validate: "/api/qr-scanner/quick-validate",
      checkIn: "/api/qr-scanner/scan-check-in",
    },
  };

  successResponse(res, config, "Camera stream initialized");
});

// Test QR scanner (for development)
const testScanner = catchAsync(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  // Generate test QR code
  const qrCode = await qrScannerService.generateQRCode(bookingId);

  // Validate it
  const validation = await qrScannerService.quickValidate(qrCode.qrData);

  successResponse(
    res,
    {
      qrCode,
      validation,
      testPassed: validation.valid,
    },
    "Scanner test completed"
  );
});

export default {
  validateQR,
  quickValidate,
  scanCheckIn,
  generateQR,
  verifyBookingCode,
  checkInByCode,
  getScanHistory,
  getScanStatistics,
  bulkCheckIn,
  initCameraStream,
  testScanner,
};
