import nodemailer from "nodemailer";
import dotenv from "dotenv";
import sgMail from '@sendgrid/mail';
dotenv.config();

class EmailService {
  constructor() {
    // Kiểm tra API KEY từ biến môi trường
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log("SendGrid Service initialized!");
    } else {
      console.error("Thiếu SENDGRID_API_KEY trong cấu hình môi trường!");
    }
  }

  // Hàm gửi mail xác nhận đặt vé
  async sendBookingConfirmation(booking, user) {
    try {
      // Xử lý hiển thị ngày giờ
      let dateStr = "Chưa xác định";
      let timeStr = "Chưa xác định";

      if (booking.showTime) {
        let dateObj = new Date(booking.showTime);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          });
          timeStr = dateObj.toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit', hour12: false
          });
        }
      }

      const msg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'quankm1520@gmail.com',
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: auto; background-color: #1a1c23; color: white; border-radius: 20px; overflow: hidden; border: 1px solid #333;">
            <div style="background: linear-gradient(90deg, #f97316, #ea580c); padding: 25px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">ĐẶT VÉ THÀNH CÔNG</h1>
            </div>
            
            <div style="padding: 25px;">
              <h2 style="color: #f97316; margin-bottom: 20px; font-size: 22px;">${booking.movieTitle}</h2>
              
              <div style="background-color: #262936; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">📅 Ngày chiếu:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">⏰ Giờ chiếu:</td>
                    <td style="padding: 8px 0; text-align: right; color: #f97316; font-size: 18px;"><b>${timeStr}</b></td>
                  </tr>
                  <tr><td colspan="2" style="border-bottom: 1px solid #3f3f46; padding: 5px 0;"></td></tr>
                  <tr>
                    <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">📍 Rạp:</td>
                    <td style="padding: 12px 0; text-align: right;">${booking.theaterName || 'CineBooking Cinema'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">📺 Phòng:</td>
                    <td style="padding: 12px 0; text-align: right;">${booking.roomName || 'Phòng chiếu'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">💺 Ghế ngồi:</td>
                    <td style="padding: 12px 0; text-align: right; color: #f97316; font-weight: bold;">${booking.seats.map(s => s.seatNumber).join(", ")}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: white; padding: 25px; border-radius: 15px; text-align: center;">
                <p style="color: #111827; margin: 0 0 15px 0; font-weight: bold;">QUÉT MÃ ĐỂ VÀO RẠP</p>
                <img src="cid:ticket_qr" style="width: 180px; height: 180px;" alt="QR Code"/>
                <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">Mã vé: <b>${booking.bookingCode}</b></p>
              </div>
            </div>
            
            <div style="background-color: #111827; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
              Vui lòng đến rạp trước 15 phút để làm thủ tục.
            </div>
          </div>
        `,
        attachments: [{
          content: booking.qrCode.split("base64,")[1],
          filename: 'ticket-qr.png',
          type: 'image/png',
          disposition: 'inline',
          contentId: 'ticket_qr'
        }]
      };

      await sgMail.send(msg);
      console.log(`✅ Đã gửi mail vé qua SendGrid cho: ${user.email}`);
    } catch (error) {
      console.error("❌ Lỗi SendGrid:", error.response ? error.response.body : error);
    }
  }

  // Gửi lịch làm việc/Giao ca cho Staff
  async sendStaffSchedule(staff, scheduleData) {
    try {
      const mailOptions = {
        from: `"Hệ thống Quản lý" <quankm1520@gmail.com>`,
        to: staff.email,
        subject: `📅 Thông báo lịch làm việc mới - ${scheduleData.date}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2563eb;">THÔNG BÁO GIAO CA</h2>
            <p>Chào <b>${staff.fullName}</b>,</p>
            <p>Bạn có lịch làm việc mới vừa được cập nhật trên hệ thống:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 5px;">
              <p>📅 <b>Ngày:</b> ${scheduleData.date}</p>
              <p>⏰ <b>Ca làm:</b> ${scheduleData.shiftName} (${scheduleData.startTime} - ${scheduleData.endTime})</p>
              <p>📍 <b>Vị trí:</b> ${scheduleData.position || 'Quầy vé/Sảnh'}</p>
              <p>🏢 <b>Rạp:</b> ${scheduleData.theaterName || 'Chưa xác định'}</p>
            </div>
            <p style="margin-top: 15px;">Vui lòng có mặt đúng giờ để thực hiện bàn giao ca.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Đã gửi lịch làm việc tới staff: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail cho staff:", error);
    }
  }

  // Gửi thông báo hủy ca làm việc cho Staff
  async sendShiftCancellation(staff, scheduleData) {
    try {
      const mailOptions = {
        from: `"Hệ thống Quản lý" <quankm1520@gmail.com>`,
        to: staff.email,
        subject: `❌ THÔNG BÁO HỦY CA LÀM VIỆC - ${scheduleData.date}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #dc2626;">THÔNG BÁO HỦY CA</h2>
            <p>Chào <b>${staff.fullName}</b>,</p>
            <p>Ca làm việc dưới đây của bạn đã được quản lý <b>HỦY BỎ</b> khỏi hệ thống:</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626;">
              <p>📅 <b>Ngày:</b> ${scheduleData.date}</p>
              <p>⏰ <b>Ca làm:</b> ${scheduleData.startTime} - ${scheduleData.endTime}</p>
              <p>📍 <b>Vị trí:</b> ${scheduleData.position}</p>
              <p>🏢 <b>Rạp:</b> ${scheduleData.theaterName || 'Chưa xác định'}</p>
            </div>
            <p style="margin-top: 15px; color: #4b5563;"><i>Bạn không cần có mặt tại rạp vào ca này. Vui lòng kiểm tra lại lịch làm việc mới nhất trên hệ thống để biết thêm chi tiết.</i></p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Đã gửi mail HỦY ca tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail hủy ca:", error);
    }
  }
}

export default new EmailService();