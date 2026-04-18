import crypto from "crypto";
import QRCode from "qrcode";
import Booking from "../models/booking.model.js";
import EntryLog from "../models/entry-log.model.js";
import { AppError } from "../utils/errors.js";

class QRScannerService {
  // Validate QR code data
  async validateQRCode(qrData) {
    try {
      // Parse QR data (format: bookingId:timestamp:signature)
      const parts = qrData.split(":");
      if (parts.length !== 3) {
        throw new AppError("Invalid QR code format", 400);
      }

      const [bookingId, timestamp, signature] = parts;

      // Verify signature
      const expectedSignature = this.generateSignature(bookingId, timestamp);
      if (signature !== expectedSignature) {
        throw new AppError("Invalid QR code signature", 400);
      }

      // Check if QR code is expired (valid for 24 hours)
      const qrTimestamp = parseInt(timestamp);
      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours

      if (now - qrTimestamp > expiryTime) {
        throw new AppError("QR code has expired", 400);
      }

      //  FIX #4: Sửa field names đúng với model
      const booking = await Booking.findById(bookingId)
        .populate("customer", "fullName email phoneNumber") //  customer không phải user
        .populate("schedule")
        .populate("theater", "name location");

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      //  FIX #4: Check status đúng với enum trong model
      if (booking.status !== "Hoàn tất") {
        //  "Hoàn tất" không phải "completed"
        throw new AppError(`Booking status is ${booking.status}`, 400);
      }

      //  FIX #4: Check if already used
      if (booking.usedAt) {
        //  usedAt không phải isCheckedIn
        const entryLog = await EntryLog.findOne({ booking: bookingId }).sort({ createdAt: -1 });
        return {
          valid: false,
          alreadyCheckedIn: true,
          booking,
          entryLog,
          message: "Ticket already used",
        };
      }

      // Check show time
      const showTime = new Date(booking.schedule.showTime);
      const currentTime = new Date();
      const timeDiff = (showTime - currentTime) / (1000 * 60); // minutes

      // Allow check-in 30 minutes before show time
      if (timeDiff < -30) {
        throw new AppError("Show time has passed", 400);
      }

      if (timeDiff > 120) {
        throw new AppError("Too early to check in. Check-in opens 2 hours before show time", 400);
      }

      return {
        valid: true,
        booking,
        showTime,
        timeDiff,
        message: "QR code is valid",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to validate QR code", 500);
    }
  }

  // Process check-in from QR scan
  async processCheckIn(qrData, staffId, theaterId, deviceInfo = {}) {
    const validation = await this.validateQRCode(qrData);

    if (!validation.valid) {
      return validation;
    }

    const { booking } = validation;

    // Verify theater matches
    if (booking.theater._id.toString() !== theaterId) {
      throw new AppError("This ticket is for a different theater", 400);
    }

    //  FIX #4: Create entry log với field names đúng
    const entryLog = await EntryLog.create({
      booking: booking._id,
      user: booking.customer, //  customer không phải user
      theater: theaterId,
      schedule: booking.schedule._id,
      staff: staffId,
      entryTime: new Date(),
      entryMethod: "qr-scan",
      deviceInfo: {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceType: deviceInfo.deviceType || "camera-scanner",
      },
      seats: booking.seats,
      verified: true,
    });

    //  FIX #4: Update booking với field names đúng
    booking.usedAt = new Date(); //  usedAt không phải isCheckedIn
    booking.status = "Đã sử dụng"; //  Update status
    await booking.save();

    return {
      success: true,
      booking,
      entryLog,
      message: "Check-in successful",
    };
  }

  // Generate QR code signature
  generateSignature(bookingId, timestamp) {
    const secret = process.env.QR_SECRET || "cinema-qr-secret-key";
    const data = `${bookingId}:${timestamp}`;
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  // Generate QR code for booking
  async generateQRCode(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const timestamp = Date.now();
    const signature = this.generateSignature(bookingId, timestamp.toString());
    const qrData = `${bookingId}:${timestamp}:${signature}`;

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Update booking with QR code
    booking.qrCode = qrCodeImage;
    booking.qrCodeData = qrData;
    await booking.save();

    return {
      qrCode: qrCodeImage,
      qrData,
      bookingId,
      expiresAt: new Date(timestamp + 24 * 60 * 60 * 1000),
    };
  }

  // Decode QR code from image (for camera upload)
  async decodeQRFromImage(imageBuffer) {
    try {
      // This would use a QR decoder library like jsQR or qrcode-reader
      // For now, we'll assume the QR data is extracted
      throw new AppError("QR image decoding not implemented. Use QR data directly.", 501);
    } catch (error) {
      throw new AppError("Failed to decode QR code from image", 500);
    }
  }

  // Get scan history
  async getScanHistory(theaterId, startDate, endDate, filters = {}) {
    const query = {
      theater: theaterId,
      entryTime: { $gte: startDate, $lte: endDate },
    };

    if (filters.staff) query.staff = filters.staff;
    if (filters.entryMethod) query.entryMethod = filters.entryMethod;
    if (filters.verified !== undefined) query.verified = filters.verified;

    const logs = await EntryLog.find(query)
      .populate("booking", "bookingCode totalPrice seats")
      .populate("user", "fullName email phone")
      .populate("staff", "fullName")
      .populate("schedule", "showTime movie")
      .sort({ entryTime: -1 });

    return logs;
  }

  // Get scan statistics
  async getScanStatistics(theaterId, startDate, endDate) {
    const logs = await EntryLog.find({
      theater: theaterId,
      entryTime: { $gte: startDate, $lte: endDate },
    });

    const stats = {
      totalScans: logs.length,
      successfulScans: logs.filter((l) => l.verified).length,
      failedScans: logs.filter((l) => !l.verified).length,
      byMethod: {},
      byHour: {},
      byStaff: {},
      averageScanTime: 0,
    };

    // Group by method
    logs.forEach((log) => {
      const method = log.entryMethod || "unknown";
      stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

      // Group by hour
      const hour = new Date(log.entryTime).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

      // Group by staff
      if (log.staff) {
        const staffId = log.staff.toString();
        stats.byStaff[staffId] = (stats.byStaff[staffId] || 0) + 1;
      }
    });

    return stats;
  }

  // Verify booking code (alternative to QR)
  async verifyBookingCode(bookingCode, theaterId) {
    //  FIX #4: Sửa field names
    const booking = await Booking.findOne({ bookingCode })
      .populate("customer", "fullName email phoneNumber") //  customer
      .populate("schedule")
      .populate("theater", "name location");

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.theater._id.toString() !== theaterId) {
      throw new AppError("This ticket is for a different theater", 400);
    }

    //  FIX #4: Status đúng
    if (booking.status !== "Hoàn tất") {
      throw new AppError(`Booking status is ${booking.status}`, 400);
    }

    //  FIX #4: Check usedAt
    if (booking.usedAt) {
      const entryLog = await EntryLog.findOne({ booking: booking._id }).sort({ createdAt: -1 });
      return {
        valid: false,
        alreadyCheckedIn: true,
        booking,
        entryLog,
        message: "Ticket already used",
      };
    }

    return {
      valid: true,
      booking,
      message: "Booking code is valid",
    };
  }

  // Bulk check-in for group bookings
  async bulkCheckIn(bookingIds, staffId, theaterId, deviceInfo = {}) {
    const results = [];

    for (const bookingId of bookingIds) {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking || !booking.qrCodeData) {
          results.push({
            bookingId,
            success: false,
            error: "Booking not found or no QR code",
          });
          continue;
        }

        const result = await this.processCheckIn(booking.qrCodeData, staffId, theaterId, deviceInfo);
        results.push({
          bookingId,
          success: result.success,
          data: result,
        });
      } catch (error) {
        results.push({
          bookingId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: bookingIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // Real-time QR validation (for live camera feed)
  async quickValidate(qrData) {
    try {
      const parts = qrData.split(":");
      if (parts.length !== 3) {
        return { valid: false, reason: "Invalid format" };
      }

      const [bookingId, timestamp, signature] = parts;
      const expectedSignature = this.generateSignature(bookingId, timestamp);

      if (signature !== expectedSignature) {
        return { valid: false, reason: "Invalid signature" };
      }

      const qrTimestamp = parseInt(timestamp);
      const now = Date.now();
      if (now - qrTimestamp > 24 * 60 * 60 * 1000) {
        return { valid: false, reason: "Expired" };
      }

      //  FIX #4: Select đúng fields
      const booking = await Booking.findById(bookingId).select("status usedAt bookingCode");
      if (!booking) {
        return { valid: false, reason: "Booking not found" };
      }

      //  FIX #4: Check usedAt
      if (booking.usedAt) {
        return { valid: false, reason: "Already checked in" };
      }

      //  FIX #4: Status đúng
      if (booking.status !== "Hoàn tất") {
        return { valid: false, reason: `Status: ${booking.status}` };
      }

      return {
        valid: true,
        bookingId,
        bookingCode: booking.bookingCode,
      };
    } catch (error) {
      return { valid: false, reason: "Validation error" };
    }
  }
}

export default new QRScannerService();
