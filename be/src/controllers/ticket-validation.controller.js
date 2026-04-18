import Booking from "../models/booking.model.js";
import EntryLog from "../models/entry-log.model.js";
import User from "../models/user.model.js";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";
import { errorResponse, successResponse } from "../utils/response.js";

const ticketValidationController = {
  // Validate ticket by booking code
  validateByBookingCode: async (req, res) => {
    try {
      const { bookingCode } = req.body;

      // Verify staff
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể xác thực vé");
      }

      // Find booking
      const booking = await Booking.findOne({ bookingCode })
        .populate("customer", "fullName email phoneNumber")
        .populate("schedule");

      if (!booking) {
        throw new NotFoundError("Không tìm thấy booking");
      }

      // Validate booking status
      if (booking.status !== "Hoàn tất") {
        return errorResponse(res, "Vé chưa được thanh toán hoặc đã bị hủy", 400);
      }

      // Check if already used
      const existingEntry = await EntryLog.checkDuplicateEntry(booking._id);

      if (existingEntry) {
        // Create duplicate entry log
        const duplicateLog = new EntryLog({
          booking: booking._id,
          bookingCode: booking.bookingCode,
          customer: booking.customer._id,
          customerName: booking.customer.fullName,
          movie: booking.movieTitle,
          theater: staff.staffInfo?.assignedTheater,
          theaterName: booking.theaterName,
          schedule: booking.schedule,
          showDate: booking.showDate,
          showTime: booking.showTime,
          seats: booking.seats,
          validatedBy: staff._id,
          validatedByName: staff.fullName,
          validationMethod: "booking_code",
          entryStatus: "duplicate",
          isDuplicate: true,
          previousEntryAt: existingEntry.validatedAt,
          notes: "Vé đã được sử dụng trước đó",
        });

        await duplicateLog.save();

        return errorResponse(res, `Vé đã được sử dụng lúc ${existingEntry.validatedAt.toLocaleString("vi-VN")}`, 400);
      }

      // Check show time
      const now = new Date();
      const showDate = new Date(booking.showDate);
      const [startTime] = booking.showTime.split(" - ");
      const [hours, minutes] = startTime.split(":");
      showDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Allow entry 30 minutes before show time
      const allowEntryTime = new Date(showDate.getTime() - 30 * 60 * 1000);

      if (now < allowEntryTime) {
        return errorResponse(
          res,
          `Chưa đến giờ vào rạp. Vui lòng quay lại sau ${allowEntryTime.toLocaleTimeString("vi-VN")}`,
          400
        );
      }

      // Create entry log
      const entryLog = new EntryLog({
        booking: booking._id,
        bookingCode: booking.bookingCode,
        customer: booking.customer._id,
        customerName: booking.customer.fullName,
        movie: booking.movieTitle,
        theater: staff.staffInfo?.assignedTheater,
        theaterName: booking.theaterName,
        schedule: booking.schedule,
        showDate: booking.showDate,
        showTime: booking.showTime,
        seats: booking.seats,
        validatedBy: staff._id,
        validatedByName: staff.fullName,
        validationMethod: "booking_code",
        entryStatus: "allowed",
      });

      await entryLog.save();

      // Update booking
      booking.usedAt = new Date();
      booking.status = "Đã sử dụng";
      await booking.save();

      return successResponse(
        res,
        {
          entryLog,
          booking: {
            bookingCode: booking.bookingCode,
            customerName: booking.customer.fullName,
            movieTitle: booking.movieTitle,
            showTime: booking.showTime,
            seats: booking.seats.map((s) => s.seatNumber),
            roomName: booking.roomName,
          },
        },
        "Xác thực vé thành công"
      );
    } catch (error) {
      console.error("Validate ticket error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Validate ticket by QR code data
  validateByQRCode: async (req, res) => {
    try {
      const { qrData } = req.body;

      // Verify staff
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể xác thực vé");
      }

      // Parse QR data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (error) {
        return errorResponse(res, "Mã QR không hợp lệ", 400);
      }

      const { bookingCode } = parsedData;

      // Reuse booking code validation logic
      req.body.bookingCode = bookingCode;
      return await ticketValidationController.validateByBookingCode(req, res);
    } catch (error) {
      console.error("Validate QR code error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get entry logs for staff
  getMyValidations: async (req, res) => {
    try {
      const { date } = req.query;
      const queryDate = date ? new Date(date) : new Date();

      const validations = await EntryLog.getStaffValidations(req.userId, queryDate);

      return successResponse(res, { validations }, "Lấy danh sách xác thực thành công");
    } catch (error) {
      console.error("Get staff validations error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get entry logs for theater (supervisor only)
  getTheaterEntries: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);

      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể truy cập");
      }

      if (!["supervisor", "manager"].includes(staff.staffInfo?.position)) {
        throw new AuthorizationError("Chỉ supervisor/manager mới có thể xem tất cả entry logs");
      }

      const { date } = req.query;
      const queryDate = date ? new Date(date) : new Date();

      const entries = await EntryLog.getTheaterEntries(staff.staffInfo.assignedTheater, queryDate);

      return successResponse(res, { entries }, "Lấy danh sách entry logs thành công");
    } catch (error) {
      console.error("Get theater entries error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Check ticket status without validating
  checkTicketStatus: async (req, res) => {
    try {
      const { bookingCode } = req.params;

      // 1. Query Booking với đầy đủ thông tin hơn
      const booking = await Booking.findOne({ bookingCode })
        .populate("customer", "fullName email phoneNumber membershipLevel") // Lấy thêm hạng thành viên
        .populate("schedule", "poster"); // Nếu cần ảnh phim (tùy model Schedule của bạn)

      if (!booking) {
        throw new NotFoundError("Không tìm thấy booking");
      }

      // 2. Kiểm tra lịch sử ra vào 
      const existingEntry = await EntryLog.checkDuplicateEntry(booking._id);

      // 3. Tính toán logic thời gian (Biết đã được vào chưa)
      const now = new Date();
      const showDate = new Date(booking.showDate);
      const [startTime] = booking.showTime.split(" - ");
      const [hours, minutes] = startTime.split(":");
      showDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Cho phép vào trước 30 phút
      const allowEntryTime = new Date(showDate.getTime() - 30 * 60 * 1000);
      const canEnterNow = now >= allowEntryTime;

      // 4. Chuẩn bị dữ liệu khách hàng (Xử lý trường hợp Guest hoặc User đăng ký)
      let customerInfo = {};
      if (booking.customer) {
        customerInfo = {
          name: booking.customer.fullName,
          phone: booking.customer.phoneNumber,
          email: booking.customer.email,
          membership: booking.customer.membershipLevel, // VIP/Member...
          type: "Member",
        };
      } else if (booking.guestCustomer) {
        customerInfo = {
          name: booking.guestCustomer.name,
          phone: booking.guestCustomer.phone,
          email: booking.guestCustomer.email,
          type: "Guest",
        };
      }

      // 5. Trả về response chi tiết
      return successResponse(
        res,
        {
          booking: {
            _id: booking._id,
            bookingCode: booking.bookingCode,
            status: booking.status,
            movieTitle: booking.movieTitle,
            theaterName: booking.theaterName,
            roomName: booking.roomName,
            showDate: booking.showDate,
            showTime: booking.showTime,
            seats: booking.seats.map((s) => ({
              seatNumber: s.seatNumber,
              seatType: s.seatType, 
            })),
            products: booking.products.map((p) => ({
              name: p.productName,
              quantity: p.quantity,
              size: p.size,
            })),
            totalAmount: booking.totalAmount,
            paymentStatus: booking.paymentDetails?.status || "Chưa thanh toán",
            customer: customerInfo,
          },
          validation: {
            isUsed: !!existingEntry,
            usedAt: existingEntry?.validatedAt || null,
            validatedBy: existingEntry?.validatedByName || null, // Ai là người đã soát vé này trước đó
            allowEntryAt: allowEntryTime,
            canEnterNow: canEnterNow, // true/false: Client dùng để hiện màu xanh/đỏ
            timeUntilEntry: Math.max(0, Math.ceil((allowEntryTime - now) / 60000)), // Số phút còn lại phải chờ
          },
        },
        "Lấy thông tin vé thành công"
      );
    } catch (error) {
      console.error("Check ticket status error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },
};

export default ticketValidationController;
