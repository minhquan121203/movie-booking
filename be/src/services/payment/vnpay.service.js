import crypto from "crypto";
import moment from "moment";
import querystring from "qs";

class VNPayService {
  // Create payment URL
  createPaymentUrl(booking, ipAddr = "12.34.56.78") {
    try {
      const tmnCode = (process.env.VNPAY_TMN_CODE || "").trim();
      const secretKey = (process.env.VNPAY_HASH_SECRET || "").trim();
      const vnpUrl = (process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").trim();
      const returnUrl = (process.env.VNPAY_RETURN_URL || "").trim();

      // 🚀 1. Ép IP chuẩn (Giải quyết triệt để lỗi do Render nối chuỗi IP quá dài)
      let cleanIp = "12.34.56.78";
      if (ipAddr && typeof ipAddr === 'string') {
        cleanIp = ipAddr.split(',')[0].trim(); // Chỉ lấy IP đầu tiên
        if (cleanIp.length > 15 || cleanIp.includes(':')) cleanIp = "12.34.56.78"; // Nếu là IPv6 hoặc lỗi thì fake IP luôn
      }

      // 2. Múi giờ VN
      const createDate = moment().utcOffset('+07:00').format("YYYYMMDDHHmmss");

      // 3. Mã đơn hàng (Bỏ đuôi thời gian để khớp với DB)
      const orderId = booking.bookingCode;
      const amount = Math.round(Number(booking.totalAmount || 0) * 100);

      // 4. Khởi tạo Params
      let vnpParams = {};
      vnpParams["vnp_Version"] = "2.1.0";
      vnpParams["vnp_Command"] = "pay";
      vnpParams["vnp_TmnCode"] = tmnCode;
      vnpParams["vnp_Locale"] = "vn";
      vnpParams["vnp_CurrCode"] = "VND";
      vnpParams["vnp_TxnRef"] = orderId;
      vnpParams["vnp_OrderInfo"] = "ThanhToanVePhim";
      vnpParams["vnp_OrderType"] = "other";
      vnpParams["vnp_Amount"] = amount;
      vnpParams["vnp_ReturnUrl"] = returnUrl;
      vnpParams["vnp_IpAddr"] = cleanIp;
      vnpParams["vnp_CreateDate"] = createDate;

      // 5. Sort theo chuẩn
      vnpParams = this.sortObject(vnpParams);

      // 6. Ký tên
      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnpParams["vnp_SecureHash"] = signed;

      // 7. Tạo link
      const paymentUrl = vnpUrl + "?" + querystring.stringify(vnpParams, { encode: false });

      console.log(`🚀 [VNPAY] Tạo link thành công cho đơn: ${orderId} (IP: ${cleanIp})`);

      return { success: true, paymentUrl, orderId };
    } catch (error) {
      console.error("Create VNPay payment URL error:", error);
      return { success: false, error: error.message };
    }
  }

  // Thuật toán sort chuẩn sách giáo khoa VNPay
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

  // Verify return URL from VNPay
  verifyReturnUrl(vnpParams) {
    try {
      const secureHash = vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHashType"];

      // Sort parameters
      const sortedParams = this.sortObject(vnpParams);

      // Create signature to compare
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      if (secureHash === signed) {
        const responseCode = vnpParams["vnp_ResponseCode"];
        const orderId = vnpParams["vnp_TxnRef"];
        const amount = parseInt(vnpParams["vnp_Amount"]) / 100;
        const transactionNo = vnpParams["vnp_TransactionNo"];
        const bankCode = vnpParams["vnp_BankCode"];
        const payDate = vnpParams["vnp_PayDate"];

        console.log(`VNPay signature verified for order ${orderId}`);

        return {
          success: true,
          verified: true,
          responseCode,
          orderId,
          amount,
          transactionNo,
          bankCode,
          payDate,
          isSuccess: responseCode === "00",
        };
      } else {
        console.warn("VNPay signature verification failed");
        return {
          success: false,
          verified: false,
          error: "Invalid signature",
        };
      }
    } catch (error) {
      console.error("Verify VNPay return URL error:", error);
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }
  }

  // Verify IPN (Instant Payment Notification)
  async verifyIpn(vnpParams, booking = null) {
    try {
      const secureHash = vnpParams["vnp_SecureHash"];
      const orderId = vnpParams["vnp_TxnRef"];
      const rspCode = vnpParams["vnp_ResponseCode"];
      const amount = parseInt(vnpParams["vnp_Amount"]) / 100; // Convert from smallest currency unit

      delete vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHashType"];

      // Sort and create signature
      const sortedParams = this.sortObject(vnpParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      //  FIX: Verify signature first
      if (secureHash !== signed) {
        console.warn(`VNPay IPN signature verification failed for order ${orderId}`);
        return {
          RspCode: "97",
          Message: "Invalid signature",
        };
      }

      //  FIX: Check orderId exists in DB if booking provided
      let checkOrderId = true;
      if (booking) {
        const bookingCode = orderId.split("_")[0];
        checkOrderId = booking.bookingCode === bookingCode;
        if (!checkOrderId) {
          console.warn(`VNPay IPN orderId mismatch: expected ${booking.bookingCode}, got ${orderId}`);
        }
      }

      //  FIX: Check amount matches
      let checkAmount = true;
      if (booking) {
        // Allow small difference due to rounding (within 1 VND)
        checkAmount = Math.abs(booking.totalAmount - amount) < 1;
        if (!checkAmount) {
          console.warn(`VNPay IPN amount mismatch: expected ${booking.totalAmount}, got ${amount}`);
        }
      }

      if (checkOrderId) {
        if (checkAmount) {
          if (rspCode === "00") {
            console.log(`VNPay IPN verified successfully for order ${orderId}`);
            return {
              RspCode: "00",
              Message: "Success",
            };
          } else {
            return {
              RspCode: "00",
              Message: "Success",
            };
          }
        } else {
          return {
            RspCode: "04",
            Message: "Amount invalid",
          };
        }
      } else {
        return {
          RspCode: "01",
          Message: "Order not found",
        };
      }
    } catch (error) {
      console.error("Verify VNPay IPN error:", error);
      return {
        RspCode: "99",
        Message: "Unknown error",
      };
    }
  }

  // Query transaction status
  async queryTransaction(orderId, transDate) {
    try {
      const requestId = moment(new Date()).format("HHmmss");
      const createDate = moment(new Date()).format("YYYYMMDDHHmmss");

      const data = {
        vnp_RequestId: requestId,
        vnp_Version: "2.1.0",
        vnp_Command: "querydr",
        vnp_TmnCode: this.tmnCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: "Truy van giao dich",
        vnp_TransactionDate: transDate,
        vnp_CreateDate: createDate,
        vnp_IpAddr: "127.0.0.1",
      };

      // Create signature
      const sortedData = this.sortObject(data);
      const signData = querystring.stringify(sortedData, { encode: false });
      const hmac = crypto.createHmac("sha512", this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      data["vnp_SecureHash"] = signed;

      console.log(`Querying VNPay transaction for order ${orderId}`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Query VNPay transaction error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Refund transaction
  async refundTransaction(transactionNo, amount, transDate, createBy) {
    try {
      const requestId = moment(new Date()).format("HHmmss");
      const createDate = moment(new Date()).format("YYYYMMDDHHmmss");

      const data = {
        vnp_RequestId: requestId,
        vnp_Version: "2.1.0",
        vnp_Command: "refund",
        vnp_TmnCode: this.tmnCode,
        vnp_TransactionType: "02",
        vnp_TxnRef: transactionNo,
        vnp_Amount: amount * 100,
        vnp_OrderInfo: "Hoan tien giao dich",
        vnp_TransactionNo: transactionNo,
        vnp_TransactionDate: transDate,
        vnp_CreateDate: createDate,
        vnp_CreateBy: createBy,
        vnp_IpAddr: "127.0.0.1",
      };

      // Create signature
      const sortedData = this.sortObject(data);
      const signData = querystring.stringify(sortedData, { encode: false });
      const hmac = crypto.createHmac("sha512", this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      data["vnp_SecureHash"] = signed;

      console.log(`Refunding VNPay transaction ${transactionNo}`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Refund VNPay transaction error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get response code message
  getResponseMessage(responseCode) {
    const messages = {
      "00": "Giao dịch thành công",
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
      10: "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
      12: "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
      13: "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
      24: "Giao dịch không thành công do: Khách hàng hủy giao dịch",
      51: "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
      65: "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
      75: "Ngân hàng thanh toán đang bảo trì.",
      79: "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
      99: "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    };

    return messages[responseCode] || "Lỗi không xác định";
  }
}

const vnPayService = new VNPayService();
export default vnPayService;
