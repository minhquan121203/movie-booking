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
      const dateObj = new Date(booking.showTime);

      const formattedDateTime = dateObj.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const mailOptions = {
        from: `"CineBooking" <quankm1520@gmail.com>`,
        to: user.email,
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; background-color: #111827; color: white; border-radius: 15px; overflow: hidden; border: 1px solid #374151;">
            <div style="background-color: #f97316; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: white;">ĐẶT VÉ THÀNH CÔNG</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #f97316; margin-top: 0; border-bottom: 2px solid #f97316; display: inline-block; padding-bottom: 5px;">${booking.movieTitle}</h2>
              
              <table style="width: 100%; color: #d1d5db; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151;">📅 <b>Ngày & Giờ:</b></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right; color: white;"><b>${formattedDateTime}</b></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151;">📍 <b>Rạp:</b></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right; color: white;">${booking.theaterName || 'Rạp CineBooking'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151;">📺 <b>Phòng chiếu:</b></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right; color: white;">${booking.roomName || 'Phòng Standard'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151;">💺 <b>Ghế ngồi:</b></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right; color: #f97316; font-weight: bold; font-size: 16px;">
                    ${booking.seats.map(s => s.seatNumber).join(", ")}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">💰 <b>Tổng thanh toán:</b></td>
                  <td style="padding: 12px 0; text-align: right; font-size: 20px; color: #f97316;"><b>${booking.totalAmount.toLocaleString('vi-VN')}đ</b></td>
                </tr>
              </table>

              <div style="margin-top: 30px; text-align: center; background-color: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <p style="color: #111827; margin-bottom: 15px; font-weight: bold; font-size: 16px;">MÃ VÉ ĐIỆN TỬ (QR CODE)</p>
                <img src="cid:ticket_qr" style="width: 220px; height: 220px;" alt="QR Code"/>
                <p style="color: #4b5563; font-size: 14px; margin-top: 15px; letter-spacing: 2px;">MÃ ĐƠN: <b>${booking.bookingCode}</b></p>
              </div>

              <div style="margin-top: 25px; font-size: 13px; color: #9ca3af; text-align: center; font-style: italic;">
                * Vui lòng xuất trình mã QR này tại quầy vé để nhận vé giấy trước giờ chiếu 15 phút.
              </div>
            </div>
            
            <div style="background-color: #1f2937; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #374151;">
              © 2026 CineBooking System. Chúc bạn có những giây phút xem phim tuyệt vời!
            </div>
          </div>
        `,
        attachments: booking.qrCode ? [
          {
            filename: 'ticket-qr.png',
            content: booking.qrCode.split("base64,")[1],
            encoding: 'base64',
            cid: 'ticket_qr'
          }
        ] : []
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ [GMAIL] Đã gửi mail vé đầy đủ thông tin tới: ${user.email}`);
    } catch (error) {
      console.error("❌ [GMAIL] Lỗi gửi mail vé:", error);
    }
  }
}

export default new EmailService();