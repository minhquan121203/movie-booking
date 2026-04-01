import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'quankm1520@gmail.com',
        pass: 'wkghykyxyrifhoqf'
      }
    });
    console.log("✅ Nodemailer (Gmail) Ready!");
  }

  // Hàm gửi mail xác nhận đặt vé (Xịn xò)
  async sendBookingConfirmation(booking, user) {
    try {
      // 1. XỬ LÝ LỖI INVALID DATE & FORMAT 2 HÀNG
      let dateStr = "Chưa xác định";
      let timeStr = "Chưa xác định";

      if (booking.showTime) {
        const dateObj = new Date(booking.showTime);

        // Kiểm tra xem dateObj có hợp lệ không
        if (!isNaN(dateObj.getTime())) {
          // Format ngày: 01/04/2026
          dateStr = dateObj.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          // Format giờ: 16:22
          timeStr = dateObj.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      }

      const mailOptions = {
        from: `"CineBooking" <quankm1520@gmail.com>`,
        to: user.email,
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; background-color: #111827; color: white; border-radius: 15px; overflow: hidden; border: 1px solid #374151;">
            <div style="background-color: #f97316; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; color: white; text-transform: uppercase;">Đặt vé thành công</h1>
            </div>
            
            <div style="padding: 25px;">
              <h2 style="color: #f97316; margin-top: 0;">${booking.movieTitle}</h2>
              
              <table style="width: 100%; color: #d1d5db; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">📅 <b>Ngày chiếu:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; color: white;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">⏰ <b>Giờ chiếu:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; color: #f97316; font-size: 18px;"><b>${timeStr}</b></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">📍 <b>Rạp:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; color: white;">${booking.theaterName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">📺 <b>Phòng chiếu:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; color: white;">${booking.roomName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">💺 <b>Ghế ngồi:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; color: #f97316; font-weight: bold;">
                    ${booking.seats.map(s => s.seatNumber).join(", ")}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; font-size: 18px;">💰 <b>Tổng tiền:</b></td>
                  <td style="padding: 15px 0; text-align: right; font-size: 20px; color: #f97316;"><b>${booking.totalAmount.toLocaleString()}đ</b></td>
                </tr>
              </table>

              <div style="margin-top: 25px; text-align: center; background-color: white; padding: 20px; border-radius: 10px;">
                <p style="color: #111827; margin: 0 0 10px 0; font-weight: bold;">MÃ QR VÉ VÀO CỬA</p>
                <img src="cid:ticket_qr" style="width: 200px; height: 200px;" alt="QR Code"/>
                <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">Mã vé: ${booking.bookingCode}</p>
              </div>
            </div>
            
            <div style="background-color: #1f2937; padding: 15px; text-align: center; font-size: 11px; color: #6b7280;">
              Vui lòng đến rạp trước 15 phút để làm thủ tục check-in.
            </div>
          </div>
        `,
        attachments: [
          {
            filename: 'ticket-qr.png',
            content: booking.qrCode.split("base64,")[1],
            encoding: 'base64',
            cid: 'ticket_qr'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ [GMAIL] Đã bùng mail thành công tới: ${user.email}`);
    } catch (error) {
      console.error("❌ [GMAIL] Lỗi gửi mail:", error);
    }
  }
}

export default new EmailService();