import sgMail from '@sendgrid/mail'; // 🚀 BẮT BUỘC có dòng này ở đầu file

class EmailService {
  constructor() {
    // 🚀 Bước 1: Khởi tạo SendGrid bằng API Key trong Env của fen
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log("✅ SendGrid Service (Full Functions) Ready!");
    } else {
      console.error("❌ Lỗi: Thiếu SENDGRID_API_KEY trong cấu hình Render!");
    }
  }

  // 1. Hàm gửi mail xác nhận đặt vé (Giữ nguyên giao diện đẹp của fen)
  async sendBookingConfirmation(booking, user) {
    try {
      let dateStr = "Chưa xác định";
      let timeStr = "Chưa xác định";

      if (booking.showTime) {
        let dateObj = new Date(booking.showTime);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }

      const msg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL, // Email gửi đi từ Env
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
                  <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">📅 Ngày chiếu:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${dateStr}</td></tr>
                  <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">⏰ Giờ chiếu:</td><td style="padding: 8px 0; text-align: right; color: #f97316; font-size: 18px;"><b>${timeStr}</b></td></tr>
                  <tr><td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">💺 Ghế ngồi:</td><td style="padding: 12px 0; text-align: right; color: #f97316; font-weight: bold;">${booking.seats.map(s => s.seatNumber).join(", ")}</td></tr>
                </table>
              </div>
              <div style="background-color: white; padding: 25px; border-radius: 15px; text-align: center;">
                <img src="cid:ticket_qr" style="width: 180px; height: 180px;" alt="QR Code"/>
                <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">Mã vé: <b>${booking.bookingCode}</b></p>
              </div>
            </div>
          </div>
        `,
        attachments: [{
          content: booking.qrCode.split("base64,")[1],
          filename: 'ticket-qr.png',
          type: 'image/png',
          disposition: 'inline',
          content_id: 'ticket_qr'
        }]
      };

      await sgMail.send(msg);
      console.log(`✅ [Vé] Đã gửi mail cho: ${user.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail vé:", error.response ? error.response.body : error);
    }
  }

  // 2. Gửi lịch làm việc/Giao ca cho Staff
  async sendStaffSchedule(staff, scheduleData) {
    try {
      const msg = {
        to: staff.email,
        from: process.env.SENDGRID_FROM_EMAIL,
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
            </div>
            <p style="margin-top: 15px;">Vui lòng có mặt đúng giờ để thực hiện bàn giao ca.</p>
          </div>
        `
      };
      await sgMail.send(msg);
      console.log(`✅ [Giao ca] Đã gửi mail tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail giao ca:", error.response ? error.response.body : error);
    }
  }

  // 3. Gửi thông báo hủy ca làm việc cho Staff
  async sendShiftCancellation(staff, scheduleData) {
    try {
      const msg = {
        to: staff.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `❌ THÔNG BÁO HỦY CA LÀM VIỆC - ${scheduleData.date}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #dc2626;">THÔNG BÁO HỦY CA</h2>
            <p>Chào <b>${staff.fullName}</b>,</p>
            <p>Ca làm việc ngày <b>${scheduleData.date}</b> của bạn đã bị HỦY.</p>
            <p>Vui lòng kiểm tra lại lịch làm việc mới nhất trên hệ thống.</p>
          </div>
        `
      };
      await sgMail.send(msg);
      console.log(`✅ [Hủy ca] Đã gửi mail tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail hủy ca:", error.response ? error.response.body : error);
    }
  }
}

export default new EmailService();