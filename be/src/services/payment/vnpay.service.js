import crypto from "crypto";
import moment from "moment";

class VNPayService {
  createPaymentUrl(booking, ipAddr = "12.34.56.78") {
    try {
      const tmnCode = "9Q7KU68U";
      const secretKey = "LJUWG61EUOP6YWWPZRA93VGPVSWLHF7N";
      const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
      const returnUrl = "https://movie-booking-api-bcfe.onrender.com/api/payment/vnpay-return";

      const createDate = moment().utcOffset('+07:00').format("YYYYMMDDHHmmss");
      const orderId = booking.bookingCode;
      const amount = Math.round(Number(booking.totalAmount || 0) * 100);

      // 1. Khai báo Params theo đúng thứ tự Alphabet để không cần hàm Sort phức tạp
      let vnpParams = {
        vnp_Amount: amount,
        vnp_Command: "pay",
        vnp_CreateDate: createDate,
        vnp_CurrCode: "VND",
        vnp_IpAddr: "12.34.56.78", // Ép cứng IP để tránh lỗi chuỗi quá dài từ Render
        vnp_Locale: "vn",
        vnp_OrderInfo: "ThanhToanVePhim",
        vnp_OrderType: "other",
        vnp_ReturnUrl: returnUrl,
        vnp_TmnCode: tmnCode,
        vnp_TxnRef: orderId,
        vnp_Version: "2.1.0"
      };

      // 2. Tự nối chuỗi ký tên (Dùng giá trị thô, KHÔNG encode để tránh lỗi 70)
      let signData = Object.keys(vnpParams)
          .map(key => `${key}=${vnpParams[key]}`)
          .join('&');

      // 3. Tạo chữ ký HMAC-SHA512
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // 4. Tạo URL thanh toán (Chỗ này mới cần encode giá trị)
      let queryParams = Object.keys(vnpParams)
          .map(key => `${key}=${encodeURIComponent(vnpParams[key])}`)
          .join('&');

      const paymentUrl = `${vnpUrl}?${queryParams}&vnp_SecureHash=${signed}`;

      console.log("--- VNPAY DEBUG ---");
      console.log("Raw Sign Data:", signData);
      console.log("Secure Hash:", signed);
      console.log("-------------------");

      return { success: true, paymentUrl, orderId };
    } catch (error) {
      console.error("VNPay Error:", error);
      return { success: false, error: error.message };
    }
  }
}

const vnPayService = new VNPayService();
export default vnPayService;