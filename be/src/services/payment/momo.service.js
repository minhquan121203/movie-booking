import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

class MoMoService {
  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE;
    this.accessKey = process.env.MOMO_ACCESS_KEY;
    this.secretKey = process.env.MOMO_SECRET_KEY;
    this.endpoint = process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
    this.returnUrl = process.env.MOMO_RETURN_URL || "http://localhost:5000/api/payment/momo-return";
    this.notifyUrl = process.env.MOMO_NOTIFY_URL || "http://localhost:5000/api/payment/momo-notify";

    const hasRealCredentials =
      this.partnerCode &&
      this.accessKey &&
      this.secretKey &&
      !this.partnerCode.includes("your_") &&
      !this.accessKey.includes("your_") &&
      !this.secretKey.includes("your_");

    if (hasRealCredentials) {
      console.log("MoMo initialized");
    } else {
      console.warn("MoMo credentials not found");
    }
  }

  // Create payment request
  async createPayment(booking, ipAddr = "127.0.0.1") {
    try {
      const orderId = `${booking.bookingCode}_${Date.now()}`;
      const requestId = orderId;
      const amount = booking.totalAmount.toString();
      const orderInfo = `Thanh toán vé phim ${booking.movieTitle}`;
      const extraData = Buffer.from(
        JSON.stringify({
          bookingId: booking._id.toString(),
          bookingCode: booking.bookingCode,
        })
      ).toString("base64");

      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.returnUrl}&requestId=${requestId}&requestType=captureWallet`;

      const signature = crypto.createHmac("sha256", this.secretKey).update(rawSignature).digest("hex");

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: this.returnUrl,
        ipnUrl: this.notifyUrl,
        extraData: extraData,
        requestType: "captureWallet",
        signature: signature,
        lang: "vi",
      };

      console.log("Creating MoMo payment request:", orderId);

      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.resultCode === 0) {
        console.log(`MoMo payment URL created for booking ${booking.bookingCode}`);
        return {
          success: true,
          paymentUrl: response.data.payUrl,
          orderId: orderId,
          requestId: requestId,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl,
        };
      } else {
        console.error("MoMo payment creation failed:", response.data);
        return {
          success: false,
          error: response.data.message || "Payment creation failed",
          resultCode: response.data.resultCode,
        };
      }
    } catch (error) {
      console.error("Create MoMo payment error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify callback signature
  verifySignature(data) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature,
      } = data;

      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const calculatedSignature = crypto.createHmac("sha256", this.secretKey).update(rawSignature).digest("hex");

      if (signature === calculatedSignature) {
        console.log(`MoMo signature verified for order ${orderId}`);

        // Decode extraData
        let decodedExtraData = {};
        try {
          decodedExtraData = JSON.parse(Buffer.from(extraData, "base64").toString());
        } catch (e) {
          console.warn("Could not decode extraData");
        }

        return {
          success: true,
          verified: true,
          resultCode: parseInt(resultCode),
          orderId,
          transId,
          amount: parseInt(amount),
          message,
          extraData: decodedExtraData,
          isSuccess: parseInt(resultCode) === 0,
        };
      } else {
        console.warn("MoMo signature verification failed");
        return {
          success: false,
          verified: false,
          error: "Invalid signature",
        };
      }
    } catch (error) {
      console.error("Verify MoMo signature error:", error);
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }
  }

  // Query transaction status
  async queryTransaction(orderId, requestId) {
    try {
      const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`;

      const signature = crypto.createHmac("sha256", this.secretKey).update(rawSignature).digest("hex");

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        orderId: orderId,
        signature: signature,
        lang: "vi",
      };

      console.log("Querying MoMo transaction:", orderId);

      const response = await axios.post("https://test-payment.momo.vn/v2/gateway/api/query", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Query MoMo transaction error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Refund transaction
  async refundTransaction(orderId, transId, amount, description) {
    try {
      const requestId = `${orderId}_refund_${Date.now()}`;

      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}&transId=${transId}`;

      const signature = crypto.createHmac("sha256", this.secretKey).update(rawSignature).digest("hex");

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        orderId: orderId,
        transId: transId,
        amount: amount.toString(),
        description: description,
        signature: signature,
        lang: "vi",
      };

      console.log("Refunding MoMo transaction:", transId);

      const response = await axios.post("https://test-payment.momo.vn/v2/gateway/api/refund", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.resultCode === 0) {
        console.log(`MoMo refund successful: ${transId}`);
        return {
          success: true,
          data: response.data,
        };
      } else {
        console.error("MoMo refund failed:", response.data);
        return {
          success: false,
          error: response.data.message,
          resultCode: response.data.resultCode,
        };
      }
    } catch (error) {
      console.error("Refund MoMo transaction error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get result code message
  getResultMessage(resultCode) {
    const messages = {
      0: "Giao dịch thành công",
      9: "Giao dịch được yêu cầu xử lý lại",
      10: "Giao dịch bị từ chối bởi người dùng",
      11: "Giao dịch bị từ chối do hết thời gian thanh toán",
      12: "Giao dịch bị từ chối do người dùng hủy",
      13: "Giao dịch bị từ chối do người dùng nhập OTP quá số lần quy định",
      20: "Giao dịch bị từ chối do số dư không đủ",
      21: "Giao dịch bị từ chối do vượt quá hạn mức thanh toán",
      1000: "Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán",
      1001: "Giao dịch thất bại do sai thông tin",
      1002: "Giao dịch thất bại do hệ thống lỗi",
      1003: "Giao dịch bị từ chối do đã hoàn tiền",
      1004: "Giao dịch thất bại do vượt quá thời gian thanh toán",
      1005: "Giao dịch thất bại do url không hợp lệ",
      1006: "Giao dịch thất bại do không tồn tại",
      1007: "Giao dịch thất bại do không tìm thấy",
      1026: "Giao dịch bị hạn chế theo thể loại đối tác",
      1080: "Giao dịch hoàn tiền bị từ chối",
      1081: "Giao dịch hoàn tiền đang được xử lý",
      2001: "Giao dịch thất bại do sai tham số",
      2007: "Giao dịch thất bại do đối tác không tồn tại",
      3001: "Giao dịch thất bại do liên kết thanh toán không tồn tại",
      3002: "Giao dịch thất bại do liên kết thanh toán không hợp lệ",
      3003: "Giao dịch thất bại do liên kết thanh toán hết hạn",
      3004: "Giao dịch thất bại do số tiền không hợp lệ",
      4001: "Giao dịch thất bại do thiếu tham số bắt buộc",
      4010: "Đơn hàng không tồn tại",
      4011: "Yêu cầu trùng lặp",
      4015: "Giao dịch thất bại do vượt quá số lần thanh toán",
      4100: "Giao dịch thất bại do người dùng không tồn tại",
      9000: "Giao dịch thất bại",
    };

    return messages[resultCode] || "Lỗi không xác định";
  }
}

const moMoService = new MoMoService();
export default moMoService;
