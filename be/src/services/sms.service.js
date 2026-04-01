// import twilio from "twilio";
// import dotenv from "dotenv";
// dotenv.config();
//
// class SMSService {
//   constructor() {
//     if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
//       this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//       this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
//       console.log("Twilio SMS initialized");
//     } else {
//       console.warn("Twilio credentials not found");
//       this.client = null;
//     }
//   }
//
//   // Format phone number to E.164 format (+84xxxxxxxxx)
//   formatPhoneNumber(phoneNumber) {
//     // Remove all non-digit characters
//     let cleaned = phoneNumber.replace(/\D/g, "");
//
//     // If starts with 0, replace with country code
//     if (cleaned.startsWith("0")) {
//       cleaned = "84" + cleaned.substring(1);
//     }
//
//     // Add + prefix if not present
//     if (!cleaned.startsWith("+")) {
//       cleaned = "+" + cleaned;
//     }
//
//     return cleaned;
//   }
//
//   // Send OTP code
//   async sendOTP(phoneNumber, otpCode) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const formattedNumber = this.formatPhoneNumber(phoneNumber);
//       const message = `Ma xac thuc cua ban la: ${otpCode}. Ma co hieu luc trong 5 phut.`;
//
//       const result = await this.client.messages.create({
//         body: message,
//         from: this.fromNumber,
//         to: formattedNumber,
//       });
//
//       console.log(`OTP sent to ${phoneNumber}, SID: ${result.sid}`);
//       return {
//         success: true,
//         messageSid: result.sid,
//       };
//     } catch (error) {
//       console.error("Send OTP error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Send booking confirmation
//   async sendBookingConfirmation(phoneNumber, booking) {
//     return { success: true, messageSid: "fake_sms_success" };
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const formattedNumber = this.formatPhoneNumber(phoneNumber);
//       const message = `[Cinema Booking] Dat ve thanh cong! Ma ve: ${booking.bookingCode}. Phim: ${booking.movieTitle}. Suat: ${booking.showTime}. Rap: ${booking.theaterName}. Ghe: ${booking.seats.map((s) => s.seatNumber).join(", ")}. Tong: ${booking.totalAmount.toLocaleString()}d`;
//
//       const result = await this.client.messages.create({
//         body: message,
//         from: this.fromNumber,
//         to: formattedNumber,
//       });
//
//       console.log(`Booking confirmation sent to ${phoneNumber}`);
//       return {
//         success: true,
//         messageSid: result.sid,
//       };
//     } catch (error) {
//       console.error("Send booking confirmation SMS error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Send booking reminder (24h before)
//   async sendBookingReminder(phoneNumber, booking) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const formattedNumber = this.formatPhoneNumber(phoneNumber);
//       const message = `[Cinema Booking] Nhac nho: Suat chieu "${booking.movieTitle}" cua ban bat dau luc ${booking.showTime}. Ma ve: ${booking.bookingCode}. Den rap truoc 15 phut nhe!`;
//
//       const result = await this.client.messages.create({
//         body: message,
//         from: this.fromNumber,
//         to: formattedNumber,
//       });
//
//       console.log(`Booking reminder sent to ${phoneNumber}`);
//       return {
//         success: true,
//         messageSid: result.sid,
//       };
//     } catch (error) {
//       console.error("Send booking reminder SMS error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Send cancellation notification
//   async sendCancellationNotification(phoneNumber, booking, refundAmount) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const formattedNumber = this.formatPhoneNumber(phoneNumber);
//       const message = `[Cinema Booking] Ve ${booking.bookingCode} da duoc huy. So tien hoan lai: ${refundAmount.toLocaleString()}d. Xu ly trong 3-5 ngay.`;
//
//       const result = await this.client.messages.create({
//         body: message,
//         from: this.fromNumber,
//         to: formattedNumber,
//       });
//
//       console.log(`Cancellation notification sent to ${phoneNumber}`);
//       return {
//         success: true,
//         messageSid: result.sid,
//       };
//     } catch (error) {
//       console.error("Send cancellation SMS error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Send promotional SMS
//   async sendPromotionalSMS(phoneNumber, promotion) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const formattedNumber = this.formatPhoneNumber(phoneNumber);
//       const message = `[Cinema Booking] ${promotion.title}. ${promotion.description}. ${promotion.code ? `Ma: ${promotion.code}` : ""} Chi tiet: ${process.env.FRONTEND_URL}`;
//
//       const result = await this.client.messages.create({
//         body: message,
//         from: this.fromNumber,
//         to: formattedNumber,
//       });
//
//       console.log(`Promotional SMS sent to ${phoneNumber}`);
//       return {
//         success: true,
//         messageSid: result.sid,
//       };
//     } catch (error) {
//       console.error("Send promotional SMS error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Send payment notification
//   async sendPaymentNotification(phoneNumber, booking, status) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const formattedNumber = this.formatPhoneNumber(phoneNumber);
//       let message;
//
//       if (status === "success") {
//         message = `[Cinema Booking] Thanh toan thanh cong! Ma ve: ${booking.bookingCode}. So tien: ${booking.totalAmount.toLocaleString()}d.`;
//       } else {
//         message = `[Cinema Booking] Thanh toan that bai cho don ${booking.bookingCode}. Vui long thu lai.`;
//       }
//
//       const result = await this.client.messages.create({
//         body: message,
//         from: this.fromNumber,
//         to: formattedNumber,
//       });
//
//       console.log(`Payment notification sent to ${phoneNumber}`);
//       return {
//         success: true,
//         messageSid: result.sid,
//       };
//     } catch (error) {
//       console.error("Send payment notification SMS error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Bulk send SMS (for promotions)
//   async bulkSendSMS(phoneNumbers, message) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       const results = [];
//       const batchSize = 100; // Twilio rate limit
//
//       for (let i = 0; i < phoneNumbers.length; i += batchSize) {
//         const batch = phoneNumbers.slice(i, i + batchSize);
//
//         const batchPromises = batch.map(async (phoneNumber) => {
//           try {
//             const formattedNumber = this.formatPhoneNumber(phoneNumber);
//             const result = await this.client.messages.create({
//               body: message,
//               from: this.fromNumber,
//               to: formattedNumber,
//             });
//             return {
//               phoneNumber,
//               success: true,
//               messageSid: result.sid,
//             };
//           } catch (error) {
//             return {
//               phoneNumber,
//               success: false,
//               error: error.message,
//             };
//           }
//         });
//
//         const batchResults = await Promise.all(batchPromises);
//         results.push(...batchResults);
//
//         // Wait between batches to respect rate limits
//         if (i + batchSize < phoneNumbers.length) {
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         }
//       }
//
//       const successCount = results.filter((r) => r.success).length;
//       console.log(`Bulk SMS sent: ${successCount}/${phoneNumbers.length} successful`);
//
//       return {
//         success: true,
//         totalSent: successCount,
//         totalFailed: phoneNumbers.length - successCount,
//         results,
//       };
//     } catch (error) {
//       console.error("Bulk send SMS error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
//
//   // Verify phone number (optional - uses Twilio Verify API)
//   async sendVerificationCode(phoneNumber) {
//     try {
//       if (!this.client) {
//         throw new Error("Twilio not initialized");
//       }
//
//       // Generate 6-digit OTP
//       const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//
//       // Store OTP in Redis/DB with expiry (implement separately)
//       // For now, just send the SMS
//
//       return await this.sendOTP(phoneNumber, otpCode);
//     } catch (error) {
//       console.error("Send verification code error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
// }
//
// const smsService = new SMSService();
// export default smsService;

import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

class SMSService {
  constructor() {
    this.client = null;
    console.log("Twilio SMS disabled for testing");
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "84" + cleaned.substring(1);
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
    return cleaned;
  }

  // 1. Gửi OTP
  async sendOTP(phoneNumber, otpCode) {
    return { success: true, messageSid: "fake_otp_success" };
  }

  // 2. Xác nhận đặt vé
  async sendBookingConfirmation(phoneNumber, booking) {
    return { success: true, messageSid: "fake_booking_success" };
  }

  // 3. Nhắc nhở suất chiếu
  async sendBookingReminder(phoneNumber, booking) {
    return { success: true, messageSid: "fake_reminder_success" };
  }

  // 4. Thông báo hủy vé
  async sendCancellationNotification(phoneNumber, booking, refundAmount) {
    return { success: true, messageSid: "fake_cancel_success" };
  }

  // 5. Gửi khuyến mãi
  async sendPromotionalSMS(phoneNumber, promotion) {
    return { success: true, messageSid: "fake_promo_success" };
  }

  // 6. Thông báo thanh toán
  async sendPaymentNotification(phoneNumber, booking, status) {
    return { success: true, messageSid: "fake_payment_success" };
  }

  // 7. Gửi hàng loạt
  async bulkSendSMS(phoneNumbers, message) {
    return {
      success: true,
      totalSent: phoneNumbers.length,
      totalFailed: 0,
      results: [],
    };
  }

  // 8. Gửi mã xác thực
  async sendVerificationCode(phoneNumber) {
    return { success: true, messageSid: "fake_verify_success" };
  }
}

const smsService = new SMSService();
export default smsService;