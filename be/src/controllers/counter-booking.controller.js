import User from "../models/user.model.js";
import counterBookingService from "../services/counter-booking.service.js";
import { AuthorizationError } from "../utils/errors.js";
import { errorResponse, successResponse } from "../utils/response.js";

const counterBookingController = {
  // Create booking at counter
  createBooking: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo booking tại quầy");
      }

      const result = await counterBookingService.createCounterBooking(req.userId, req.body);

      let responseData = result.toObject ? result.toObject() : { ...result };
      const bookingData = responseData.booking || result.booking;

      if (req.body.paymentMethod === 'bank_transfer' && bookingData) {
        try {
          const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

          const Booking = (await import("../models/booking.model.js")).default;
          await Booking.findByIdAndUpdate(bookingData._id, {
            "paymentDetails.transactionId": payosOrderCode.toString()
          });

          const requestData = {
            orderCode: payosOrderCode,
            amount: bookingData.totalAmount,
            description: `VEQUAY ${bookingData.bookingCode}`.substring(0, 25),
            returnUrl: `https://movie-booking-cinema.vercel.app/staff/sell`,
            cancelUrl: `https://movie-booking-cinema.vercel.app/staff/sell`
          };

          const PayOSModule = await import("@payos/node");
          const PayOSClass = PayOSModule.PayOS || PayOSModule.default;

          const payosClient = new PayOSClass(
              process.env.PAYOS_CLIENT_ID,
              process.env.PAYOS_API_KEY,
              process.env.PAYOS_CHECKSUM_KEY
          );

          let paymentLink;
          if (typeof payosClient.createPaymentLink === 'function') {
            paymentLink = await payosClient.createPaymentLink(requestData);
          } else if (payosClient.paymentRequests && typeof payosClient.paymentRequests.create === 'function') {
            paymentLink = await payosClient.paymentRequests.create(requestData);
          } else {
            throw new Error("Không tìm thấy hàm tạo link thanh toán của PayOS");
          }

          const finalData = {
            ...responseData,
            payosCheckoutUrl: paymentLink.checkoutUrl
          };

          return successResponse(res, finalData, "Đang tạo mã QR thanh toán...", 201);
        } catch (payosError) {
          console.error("❌ Lỗi tạo link PayOS Bán vé tại quầy:", payosError);
          return successResponse(res, responseData, "Tạo đơn thành công nhưng lỗi kết nối PayOS", 201);
        }
      }

      return successResponse(res, responseData, "Tạo booking tại quầy thành công", 201);
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

      const productsData = req.body.products || req.body.items || [];
      if (productsData && typeof productsData === "object" && !Array.isArray(productsData)) {
        req.body.products = Object.values(productsData);
      } else {
        req.body.products = productsData;
      }

      const result = await counterBookingService.createConcessionTransaction(req.userId, req.body);
      let responseData = result.toObject ? result.toObject() : { ...result._doc || result };

      // PAYOS BÁN ĐỒ ĂN
      if (req.body.paymentMethod === 'bank_transfer') {
        try {
          const PayOSModule = await import("@payos/node");
          const PayOSClass = PayOSModule.PayOS || PayOSModule.default;
          const payosClient = new PayOSClass(
              process.env.PAYOS_CLIENT_ID,
              process.env.PAYOS_API_KEY,
              process.env.PAYOS_CHECKSUM_KEY
          );

          const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
          const amount = responseData.totalAmount || (responseData.transaction && responseData.transaction.totalAmount) || 0;
          const txCode = responseData.transactionId || (responseData.transaction && responseData.transaction.transactionId) || "BAPNUOC";

          const requestData = {
            orderCode: payosOrderCode,
            amount: amount,
            description: `BUNNY ${txCode}`.substring(0, 25),
            returnUrl: `https://movie-booking-cinema.vercel.app/staff/concession`,
            cancelUrl: `https://movie-booking-cinema.vercel.app/staff/concession`
          };

          let paymentLink;
          if (typeof payosClient.createPaymentLink === 'function') {
            paymentLink = await payosClient.createPaymentLink(requestData);
          } else if (payosClient.paymentRequests && typeof payosClient.paymentRequests.create === 'function') {
            paymentLink = await payosClient.paymentRequests.create(requestData);
          } else {
            throw new Error("Không tìm thấy hàm PayOS");
          }

          const finalData = {
            ...responseData,
            payosCheckoutUrl: paymentLink.checkoutUrl,
            payosQrCode: paymentLink.qrCode,
            payosOrderCode: payosOrderCode
          };

          const CounterTransaction = (await import("../models/counter-transaction.model.js")).default;
          const docId = responseData._id || (responseData.transaction && responseData.transaction._id);
          if (docId) {
            await CounterTransaction.findByIdAndUpdate(docId, { transactionId: payosOrderCode.toString() });
          }

          return successResponse(res, finalData, "Đang tạo mã QR...", 201);
        } catch (payosError) {
          console.error("Lỗi tạo link PayOS bán đồ ăn:", payosError);
          return successResponse(res, responseData, "Tạo đơn thành công nhưng lỗi PayOS", 201);
        }
      }

      // Luồng tiền mặt bình thường
      return successResponse(res, responseData, "Tạo giao dịch bán hàng thành công", 201);
    } catch (error) {
      console.error("❌ LỖI BÁN ĐỒ ĂN TẠI QUẦY:", error);
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