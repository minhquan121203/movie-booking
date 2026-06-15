import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import Schedule from '../models/schedule.model.js';

class EmailService {
  constructor() {
    this.mode = null; // 'sendgrid' hoặc 'gmail'
    this._init();
  }

  _init() {
    // Ưu tiên SendGrid (HTTP API - hoạt động trên Render)
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.mode = 'sendgrid';
      console.log("✅ Email Service: SendGrid (HTTP API) Ready!");
      return;
    }

    // Fallback: Gmail SMTP (chỉ hoạt động ở local, Render chặn SMTP)
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      this.mode = 'gmail';
      console.log("✅ Email Service: Gmail SMTP Ready!");
      return;
    }

    console.error("⚠️ Email Service: Không tìm thấy cấu hình email nào (SENDGRID_API_KEY hoặc GMAIL_USER + GMAIL_APP_PASSWORD)!");
  }

  getSenderEmail() {
    return process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'quankm1520@gmail.com';
  }

  /**
   * Gửi email chung - hỗ trợ cả SendGrid và Gmail
   */
  async _send({ to, subject, html, attachments = [] }) {
    if (!this.mode) {
      console.error("[Email] Chưa cấu hình email service, bỏ qua.");
      return;
    }

    if (this.mode === 'sendgrid') {
      const msg = {
        to,
        from: { name: 'CineBooking', email: this.getSenderEmail() },
        subject,
        html,
      };

      // Convert attachments cho SendGrid format
      if (attachments.length > 0) {
        msg.attachments = attachments.map(att => ({
          content: att.content instanceof Buffer
            ? att.content.toString('base64')
            : att.content,
          filename: att.filename,
          type: att.type || 'image/png',
          disposition: att.disposition || 'inline',
          content_id: att.cid || att.content_id,
        }));
      }

      await sgMail.send(msg);
    } else if (this.mode === 'gmail') {
      const mailOptions = {
        from: `"CineBooking" <${this.getSenderEmail()}>`,
        to,
        subject,
        html,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content instanceof Buffer ? att.content : Buffer.from(att.content, 'base64'),
          cid: att.cid || att.content_id,
        })),
      };

      await this.transporter.sendMail(mailOptions);
    }
  }

  // =============================================
  // Hàm gửi mail ĐẶT VÉ
  // =============================================
  async sendBookingConfirmation(booking, user) {
    try {
      if (!user || !user.email) {
        console.log(`[Đặt vé] Bỏ qua gửi email vì user không có email.`);
        return;
      }

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

      // Xử lý QR Code attachment
      const attachments = [];
      let qrImgTag = "";

      if (booking.qrCode && typeof booking.qrCode === 'string' && booking.qrCode.includes("base64,")) {
        const base64Data = booking.qrCode.split("base64,")[1];
        attachments.push({
          content: base64Data,
          filename: 'ticket-qr.png',
          type: 'image/png',
          disposition: 'inline',
          cid: 'ticket_qr',
          content_id: 'ticket_qr',
        });
        qrImgTag = `<p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px;">QUÉT MÃ ĐỂ VÀO RẠP</p>
                    <img src="cid:ticket_qr" style="width: 180px; height: 180px; border: 1px solid #eee;" alt="QR Code"/>`;
      }

      const html = `
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
      `;

      await this._send({
        to: user.email,
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html,
        attachments,
      });

      console.log(`[Đặt vé] ✅ Mail đã gửi tới: ${user.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail đặt vé:", error.response ? error.response.body : error);
    }
  }

  // =============================================
  // Gửi lịch GIAO CA
  // =============================================
  async sendStaffSchedule(staff, scheduleData) {
    try {
      const html = `
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
      `;

      await this._send({
        to: staff.email,
        subject: `📅 Thông báo lịch làm việc mới - ${scheduleData.date}`,
        html,
      });

      console.log(`[Giao ca] ✅ Mail đã gửi tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail giao ca:", error.response ? error.response.body : error);
    }
  }

  // =============================================
  // Gửi thông báo HỦY CA
  // =============================================
  async sendShiftCancellation(staff, scheduleData) {
    try {
      const html = `
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
      `;

      await this._send({
        to: staff.email,
        subject: `❌ THÔNG BÁO HỦY CA LÀM VIỆC - ${scheduleData.date}`,
        html,
      });

      console.log(`[Hủy ca] ✅ Mail đã gửi tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail hủy ca:", error.response ? error.response.body : error);
    }
  }
}

export default new EmailService();