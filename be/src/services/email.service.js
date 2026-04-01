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
      const mailOptions = {
        from: `"CineBooking" <quankm1520@gmail.com>`,
        to: user.email,
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #111827; color: white; border-radius: 15px; overflow: hidden; border: 1px solid #374151;">
            <div style="background-color: #f97316; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">ĐẶT VÉ THÀNH CÔNG</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #f97316; margin-top: 0;">${booking.movieTitle}</h2>
              
              <table style="width: 100%; color: #d1d5db; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">🕒 <b>Thời gian:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right;">${booking.showTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">📍 <b>Rạp:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right;">${booking.theaterName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">📺 <b>Phòng:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right;">${booking.roomName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151;">💺 <b>Ghế ngồi:</b></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; color: #f97316; font-weight: bold;">
                    ${booking.seats.map(s => s.seatNumber).join(", ")}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">💰 <b>Tổng tiền:</b></td>
                  <td style="padding: 10px 0; text-align: right; font-size: 18px; color: #f97316;"><b>${booking.totalAmount.toLocaleString()}đ</b></td>
                </tr>
              </table>

              <div style="margin-top: 30px; text-align: center; background-color: white; padding: 20px; border-radius: 10px;">
                <p style="color: #111827; margin-bottom: 10px;"><b>Mã QR vé của bạn:</b></p>
                <img src="cid:ticket_qr" style="width: 200px; height: 200px;" alt="QR Code"/>
                <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">Mã vé: ${booking.bookingCode}</p>
              </div>

              <div style="margin-top: 20px; font-size: 13px; color: #9ca3af; text-align: center;">
                Vui lòng đưa mã này cho nhân viên tại rạp để nhận vé.
              </div>
            </div>
            
            <div style="background-color: #1f2937; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
              © 2026 CineBooking System. Chúc bạn xem phim vui vẻ!
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
      console.log(`✅ Đã bùng mail vé thành công tới: ${user.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail vé:", error);
    }
  }
}

export default new EmailService();