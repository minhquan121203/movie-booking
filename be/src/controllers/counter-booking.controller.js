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
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo giao dịch tại quầy");
      }

      if (req.body.products && typeof req.body.products === "object" && !Array.isArray(req.body.products)) {
        req.body.products = Object.values(req.body.products);
      }

      const result = await counterBookingService.createConcessionTransaction(req.userId, req.body);

      let responseData = result.toObject ? result.toObject() : { ...result._doc || result };

      // PAYOS BÁN ĐỒ ĂN
      if (req.body.paymentMethod === 'bank_transfer') {
        try {
          const payosService = (await import("../services/payment/payos.service.js")).default;
          const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

          const amount = responseData.totalAmount || (responseData.transaction && responseData.transaction.totalAmount) || 0;
          const txCode = responseData.transactionId || (responseData.transaction && responseData.transaction.transactionId) || "BAPNUOC";

          const requestData = {
            orderCode: payosOrderCode,
            amount: amount,
            description: `BUNNY ${txCode}`.substring(0, 25),
            returnUrl: `https://movie-booking-cinema.vercel.app`,
            cancelUrl: `https://movie-booking-cinema.vercel.app`
          };

          const paymentLink = await payosService.paymentRequests.create(requestData);

          const finalData = {
            ...responseData,
            payosCheckoutUrl: paymentLink.checkoutUrl,
            payosQrCode: paymentLink.qrCode,
            payosOrderCode: payosOrderCode
          };

          const CounterTransaction = (await import("../models/counterTransaction.model.js")).default;
          const docId = responseData._id || (responseData.transaction && responseData.transaction._id);
          if (docId) {
            await CounterTransaction.findByIdAndUpdate(docId, { transactionId: payosOrderCode.toString() });
          }

          return successResponse(res, finalData, "Tạo giao dịch bán hàng thành công", 201);
        } catch (payosError) {
          console.error("Lỗi tạo link PayOS:", payosError);
        }
      }

      return successResponse(res, responseData, "Tạo giao dịch bán hàng thành công", 201);
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
