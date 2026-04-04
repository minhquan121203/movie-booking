import crypto from "crypto";
import moment from "moment";
import querystring from "qs";
import dotenv from "dotenv";
dotenv.config();

class VNPayService {
  constructor() {
    this.vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    this.tmnCode = process.env.VNPAY_TMN_CODE;
    this.hashSecret = process.env.VNPAY_HASH_SECRET;
    this.returnUrl = process.env.VNPAY_RETURN_URL || "https://movie-booking-api-bcfe.onrender.com/api/payment/vnpay-return";

    if (this.tmnCode && this.hashSecret) {
      console.log("✅ VNPay Service initialized");
    } else {
      console.warn("⚠️ VNPay credentials not found");
    }
  }

  // Thuật toán sort chuẩn VNPay
  sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }

  // Create payment URL (Bọc thép)
  createPaymentUrl(booking, ipAddr = "12.34.56.78") {
    try {
      let cleanIp = "12.34.56.78";
      if (ipAddr && typeof ipAddr === 'string') {
        cleanIp = ipAddr.split(',')[0].trim();
        if (cleanIp.length > 15 || cleanIp.includes(':')) cleanIp = "12.34.56.78";
      }

      const createDate = moment().utcOffset('+07:00').format("YYYYMMDDHHmmss");
      const orderId = booking.bookingCode;
      const amount = Math.round(Number(booking.totalAmount || 0) * 100);

      let vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: this.tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: "ThanhToanVePhim",
        vnp_OrderType: "other",
        vnp_Amount: amount,
        vnp_ReturnUrl: this.returnUrl,
        vnp_IpAddr: cleanIp,
        vnp_CreateDate: createDate,
      };

      vnpParams = this.sortObject(vnpParams);

      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac("sha512", this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnpParams["vnp_SecureHash"] = signed;

      const paymentUrl = this.vnpUrl + "?" + querystring.stringify(vnpParams, { encode: false });

      console.log(`🚀 [VNPAY] Tạo link cho đơn: ${orderId}`);
      return { success: true, paymentUrl, orderId };
    } catch (error) {
      console.error("Create VNPay URL error:", error);
      return { success: false, error: error.message };
    }
  }

  // Verify return URL from VNPay
  verifyReturnUrl(vnpParams) {
    try {
      const secureHash = vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHashType"];

      const sortedParams = this.sortObject(vnpParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      if (secureHash === signed) {
        return {
          success: true,
          verified: true,
          responseCode: vnpParams["vnp_ResponseCode"],
          orderId: vnpParams["vnp_TxnRef"],
          amount: parseInt(vnpParams["vnp_Amount"]) / 100,
          transactionNo: vnpParams["vnp_TransactionNo"],
          bankCode: vnpParams["vnp_BankCode"],
          payDate: vnpParams["vnp_PayDate"],
          isSuccess: vnpParams["vnp_ResponseCode"] === "00",
        };
      } else {
        return { success: false, verified: false, error: "Invalid signature" };
      }
    } catch (error) {
      return { success: false, verified: false, error: error.message };
    }
  }

  // Các hàm queryTransaction và refundTransaction fen giữ nguyên như cũ t không chèn vào cho đỡ dài nhé...
}

const vnPayService = new VNPayService();
export default vnPayService;