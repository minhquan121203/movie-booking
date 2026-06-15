import sgMail from '@sendgrid/mail';
import Schedule from '../models/schedule.model.js';

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log("SendGrid Service (Full Functions) Ready!");
    } else {
      console.error("Lỗi: Thiếu SENDGRID_API_KEY trong cấu hình Render!");
    }
  }

  getSender() {
    return {
      name: 'CineBooking',
      email: process.env.SENDGRID_FROM_EMAIL || 'quankm1520@gmail.com'
    };
  }

  // Hàm gửi mail ĐẶT VÉ
  async sendBookingConfirmation(booking, user) {
    try {
      let dateStr = "Đang cập nhật";
      let timeStr = "Đang cập nhật";

      let sched = booking.schedule;
      if (sched && (!sched.startTime && !sched.date && !sched.time)) {
        try {
          sched = await Schedule.findById(sched);
        } catch (e) { console.error("Không tìm thấy Schedule"); }
      }

      const sourceTime = booking.showTime || booking.time || (sched && (sched.startTime || sched.time));
      const sourceDate = booking.showDate || (sched && sched.date) || sourceTime;

      // Xử lý Giờ
      if (sourceTime) {
        const timeObj = new Date(sourceTime);
        if (!isNaN(timeObj.getTime())) {
          timeStr = timeObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
          dateStr = timeObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else if (typeof sourceTime === 'string' && sourceTime.includes(':')) {
          timeStr = sourceTime.substring(0, 5);
        }
      }

      // Xử lý Ngày
      if (sourceDate && dateStr === "Đang cập nhật") {
        const dateObj = new Date(sourceDate);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else if (typeof sourceDate === 'string') {
          dateStr = sourceDate;
        }
      }

      if (!user || !user.email) {
        console.log(`[Đặt vé] Bỏ qua gửi email vì user không có email.`);
        return;
      }

      const attachments = [];
      let qrImgTag = "";

      if (booking.qrCode && typeof booking.qrCode === 'string' && booking.qrCode.includes("base64,")) {
        attachments.push({
          content: booking.qrCode.split("base64,")[1],
          filename: 'ticket-qr.png',
          type: 'image/png',
          disposition: 'inline',
          content_id: 'ticket_qr'
        });
        qrImgTag = `<p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px;">QUÉT MÃ ĐỂ VÀO RẠP</p>
                    <img src="cid:ticket_qr" style="width: 180px; height: 180px; border: 1px solid #eee;" alt="QR Code"/>`;
      }

      const msg = {
        to: user.email,
        from: this.getSender(),
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 20px auto; background-color: #1a1c23; color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(90deg, #f97316, #ea580c); padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">ĐẶT VÉ THÀNH CÔNG</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #f97316; margin: 0 0 20px 0; font-size: 22px;">${booking.movieTitle}</h2>
              
              <div style="background-color: #262936; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">📅 Ngày chiếu:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: white;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">⏰ Giờ chiếu:</td>
                    <td style="padding: 8px 0; text-align: right; color: #f97316; font-size: 18px; font-weight: bold;">${timeStr}</td>
                  </tr>
                  <tr><td colspan="2" style="border-bottom: 1px solid #3f3f46; padding: 5px 0;"></td></tr>
                  <tr>
                    <td style="padding: 12px 0; color: #9ca3af;">📍 Rạp:</td>
                    <td style="padding: 12px 0; text-align: right; color: white;">${booking.theaterName || 'CGV Sense City'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">📺 Phòng:</td>
                    <td style="padding: 8px 0; text-align: right; color: white;">${booking.roomName || 'Phòng 1'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">💺 Ghế ngồi:</td>
                    <td style="padding: 8px 0; text-align: right; color: #f97316; font-weight: bold;">${booking.seats.map(s => s.seatNumber).join(", ")}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #ffffff; padding: 25px; border-radius: 15px; text-align: center; color: #111827;">
                ${qrImgTag}
                <p style="color: #6b7280; font-size: 11px; margin-top: 10px;">Mã vé: <b>${booking.bookingCode}</b></p>
              </div>
            </div>
            <div style="background-color: #111827; padding: 15px; text-align: center; font-size: 11px; color: #4b5563;">
              Vui lòng đến rạp trước 15 phút để làm thủ tục.
            </div>
          </div>
        `,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      await sgMail.send(msg);
      console.log(`[Đặt vé] Mail đã gửi tới: ${user.email}`);
    } catch (error) {
      console.error("Lỗi gửi mail đặt vé:", error.response ? error.response.body : error);
    }
  }

  // Gửi lịch GIAO CA
  async sendStaffSchedule(staff, scheduleData) {
    try {
      const msg = {
        to: staff.email,
        from: this.getSender(),
        subject: `📅 Thông báo lịch làm việc mới - ${scheduleData.date}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="padding: 30px;">
              <h2 style="color: #ef4444; margin: 0 0 15px 0; font-size: 22px;">THÔNG BÁO LỊCH LÀM VIỆC</h2>
              <p>Chào <b>${staff.fullName || 'KMQ'}</b>,</p>
              <p>Hệ thống vừa cập nhật ca làm mới của bạn:</p>
              <div style="margin-top: 20px; padding: 20px; background-color: #fff1f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <p>📅 <b>Ngày:</b> ${scheduleData.date}</p>
                <p>⏰ <b>Ca làm:</b> ${scheduleData.startTime} - ${scheduleData.endTime}</p>
                <p>📍 <b>Vị trí:</b> ${scheduleData.position || 'staff'}</p>
                <p>🏢 <b>Rạp:</b> ${scheduleData.theaterName || 'CGV Sense City'}</p>
              </div>
              <p style="margin-top: 20px; font-size: 13px; color: #6b7280; font-style: italic;">Vui lòng có mặt đúng giờ để thực hiện bàn giao ca.</p>
            </div>
          </div>
        `
      };
      await sgMail.send(msg);
      console.log(`[Giao ca] Mail đã gửi tới: ${staff.email}`);
    } catch (error) {
      console.error("Lỗi gửi mail giao ca:", error.response ? error.response.body : error);
    }
  }

  // Gửi thông báo HỦY CA
  async sendShiftCancellation(staff, scheduleData) {
    try {
      const msg = {
        to: staff.email,
        from: this.getSender(),
        subject: `❌ THÔNG BÁO HỦY CA LÀM VIỆC - ${scheduleData.date}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="padding: 30px;">
              <h2 style="color: #ef4444; margin: 0 0 15px 0; font-size: 22px;">THÔNG BÁO HỦY CA</h2>
              <p>Chào <b>${staff.fullName || 'KMQ'}</b>,</p>
              <p>Ca làm việc dưới đây của bạn đã được quản lý <b>HỦY BỎ</b>:</p>
              <div style="margin-top: 20px; padding: 20px; background-color: #fff1f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <p>📅 <b>Ngày:</b> ${scheduleData.date}</p>
                <p>⏰ <b>Ca làm:</b> ${scheduleData.startTime} - ${scheduleData.endTime}</p>
                <p>🏢 <b>Rạp:</b> ${scheduleData.theaterName || 'CGV Sense City'}</p>
              </div>
              <p style="margin-top: 20px; font-size: 13px; color: #6b7280; font-style: italic;">Bạn không cần có mặt tại rạp vào ca này.</p>
            </div>
          </div>
        `
      };
      await sgMail.send(msg);
      console.log(`[Hủy ca] Mail đã gửi tới: ${staff.email}`);
    } catch (error) {
      console.error("Lỗi gửi mail hủy ca:", error.response ? error.response.body : error);
    }
  }
}

export default new EmailService();