import User from "../models/user.model.js";
import counterBookingService from "../services/counter-booking.service.js";
import { AuthorizationError } from "../utils/errors.js";
import { errorResponse, successResponse } from "../utils/response.js";

const counterBookingController = {
  // Create booking at counter
  createBooking: async (req, res) => {
    try {
      // Verify staff role
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo booking tại quầy");
      }

      const result = await counterBookingService.createCounterBooking(req.userId, req.body);

      return successResponse(res, result, "Tạo booking tại quầy thành công", 201);
    } catch (error) {
      console.error("Create counter booking error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Create concession transaction at counter
  createConcessionBooking: async (req, res) => {
    try {
      // Verify staff role
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo giao dịch tại quầy");
      }

      // Normalize products if it came as an object (e.g. "0": {...})
      if (req.body.products && typeof req.body.products === "object" && !Array.isArray(req.body.products)) {
        req.body.products = Object.values(req.body.products);
      }

      const result = await counterBookingService.createConcessionTransaction(req.userId, req.body);

      // PAYOS BÁN ĐỒ ĂN
      if (req.body.paymentMethod === 'bank_transfer') {
        try {
          // Import service PayOS
          const payosService = (await import("../services/payment/payos.service.js")).default;

          // Mã đơn hàng PayOS (số nguyên ngẫu nhiên)
          const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

          // Tùy cấu trúc result của Service trả về, lấy tổng tiền và mã đơn
          const amount = result.totalAmount || (result.transaction && result.transaction.totalAmount) || 0;
          const txCode = result.transactionId || (result.transaction && result.transaction.transactionId) || "BAPNUOC";

          const requestData = {
            orderCode: payosOrderCode,
            amount: amount,
            description: `BUNNY ${txCode}`.substring(0, 25),
            returnUrl: `https://movie-booking-cinema.vercel.app`,
            cancelUrl: `https://movie-booking-cinema.vercel.app`
          };

          const paymentLink = await payosService.paymentRequests.create(requestData);

          result.payosCheckoutUrl = paymentLink.checkoutUrl;
          result.payosQrCode = paymentLink.qrCode;

          const CounterTransaction = (await import("../models/counterTransaction.model.js")).default;
          const docId = result._id || (result.transaction && result.transaction._id);
          if (docId) {
            await CounterTransaction.findByIdAndUpdate(docId, {
              transactionId: payosOrderCode.toString()
            });
          }
        } catch (payosError) {
          console.error("Lỗi tạo link PayOS cho bán đồ ăn:", payosError);
        }
      }

      return successResponse(res, result, "Tạo giao dịch bán hàng thành công", 201);
    } catch (error) {
      console.error("Create concession transaction error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get staff's transactions
  getMyTransactions: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const transactions = await counterBookingService.getStaffTransactions(req.userId, start, end);

      return successResponse(res, { transactions }, "Lấy danh sách giao dịch thành công");
    } catch (error) {
      console.error("Get staff transactions error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get theater's transactions (for supervisors)
  getTheaterTransactions: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);

      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể truy cập");
      }

      if (!["supervisor", "manager"].includes(staff.staffInfo?.position)) {
        throw new AuthorizationError("Chỉ supervisor/manager mới có thể xem tất cả giao dịch");
      }

      const { date } = req.query;
      const queryDate = date ? new Date(date) : new Date();

      const transactions = await counterBookingService.getTheaterTransactions(
        staff.staffInfo.assignedTheater,
        queryDate
      );

      return successResponse(res, { transactions }, "Lấy danh sách giao dịch thành công");
    } catch (error) {
      console.error("Get theater transactions error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },
};

export default counterBookingController;
