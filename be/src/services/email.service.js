import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log("✅ SendGrid Service (Full Functions) Ready!");
    } else {
      console.error("❌ Lỗi: Thiếu SENDGRID_API_KEY trong cấu hình Render!");
    }
  }

  // Hàm gửi mail xác nhận đặt vé
  async sendBookingConfirmation(booking, user) {
    try {
      let dateStr = "Đang cập nhật";
      let timeStr = "Đang cập nhật";

      const showTimeSource = booking.showTime || (booking.schedule && booking.schedule.startTime);

      if (showTimeSource) {
        const dateObj = new Date(showTimeSource);
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
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `🎟️ Xác nhận đặt vé thành công - ${booking.movieTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 20px auto; background-color: #1a1c23; color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(90deg, #f97316, #ea580c); padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">ĐẶT VÉ THÀNH CÔNG</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #f97316; margin: 0 0 25px 0; font-size: 24px; font-weight: 700;">${booking.movieTitle}</h2>
              
              <div style="background-color: #262936; border-radius: 16px; padding: 25px; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <tr>
                    <td style="padding: 10px 0; color: #9ca3af;">📅 Ngày chiếu:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #9ca3af;">⏰ Giờ chiếu:</td>
                    <td style="padding: 10px 0; text-align: right; color: #f97316; font-size: 18px; font-weight: 700;">${timeStr}</td>
                  </tr>
                  <tr><td colspan="2" style="border-bottom: 1px solid #3f3f46; padding: 5px 0;"></td></tr>
                  <tr style="vertical-align: top;">
                    <td style="padding: 15px 0; color: #9ca3af;">📍 Rạp:</td>
                    <td style="padding: 15px 0; text-align: right;">${booking.theaterName || 'CineBooking Cinema'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #9ca3af;">📺 Phòng:</td>
                    <td style="padding: 10px 0; text-align: right;">${booking.roomName || 'Phòng chiếu'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #9ca3af;">💺 Ghế ngồi:</td>
                    <td style="padding: 10px 0; text-align: right; color: #f97316; font-weight: 800;">${booking.seats.map(s => s.seatNumber).join(", ")}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #ffffff; padding: 30px; border-radius: 20px; text-align: center; color: #111827;">
                <p style="margin: 0 0 15px 0; font-weight: 800; font-size: 14px; letter-spacing: 1px;">QUÉT MÃ ĐỂ VÀO RẠP</p>
                <div style="display: inline-block; padding: 10px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  <img src="cid:ticket_qr" style="width: 200px; height: 200px; display: block;" alt="Ticket QR"/>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Mã đặt vé: <b style="color: #111827;">${booking.bookingCode}</b></p>
                
                <div style="margin-top: 15px;">
                   <img src="https://img.icons8.com/ios-glyphs/30/9ca3af/ellipsis.png" width="20" alt="more"/>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #4b5563;">
              Vui lòng đến rạp trước 15 phút để làm thủ tục.<br/>
              © 2026 CineBooking System.
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
      console.log(`✅ [Đặt vé] Mail Dark-mode đã gửi tới: ${user.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail đặt vé:", JSON.stringify(error.response?.body, null, 2) || error);
    }
  }

  //  Gửi lịch làm việc/Giao ca cho Staff
  async sendStaffSchedule(staff, scheduleData) {
    try {
      const msg = {
        to: staff.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `📅 Thông báo lịch làm việc mới - ${scheduleData.date}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="padding: 32px;">
              <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">THÔNG BÁO LỊCH LÀM VIỆC</h2>
              <p style="color: #374151; font-size: 16px;">Chào <b>${staff.fullName || 'KMQ'}</b>,</p>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Lịch làm việc dưới đây của bạn đã được cập nhật trên hệ thống:</p>
              
              <div style="margin-top: 24px; padding: 20px; background-color: #fff1f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px; width: 120px;">📅 <b>Ngày:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">⏰ <b>Ca làm:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.startTime} - ${scheduleData.endTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">📍 <b>Vị trí:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.position || 'staff'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">🏢 <b>Rạp:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.theaterName || 'CGV Sense City'}</td>
                  </tr>
                </table>
                <div style="margin-top: 12px;">
                   <img src="https://img.icons8.com/ios-glyphs/30/9ca3af/ellipsis.png" width="20" alt="more"/>
                </div>
              </div>
              
              <p style="margin-top: 24px; color: #6b7280; font-size: 14px; font-style: italic; line-height: 1.6;">
                Vui lòng có mặt đúng giờ để thực hiện bàn giao ca. Bạn có thể kiểm tra lại lịch làm việc chi tiết trên hệ thống.
              </p>
            </div>
          </div>
        `
      };
      await sgMail.send(msg);
      console.log(`✅ [Giao ca] Đã gửi mail thành công tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail giao ca:", error.response ? error.response.body : error);
    }
  }

  // Gửi thông báo hủy ca làm việc cho Staff
  async sendShiftCancellation(staff, scheduleData) {
    try {
      const msg = {
        to: staff.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `❌ THÔNG BÁO HỦY CA LÀM VIỆC - ${scheduleData.date}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="padding: 32px;">
              <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">THÔNG BÁO HỦY CA</h2>
              <p style="color: #374151; font-size: 16px;">Chào <b>${staff.fullName || 'KMQ'}</b>,</p>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Ca làm việc dưới đây của bạn đã được quản lý <b>HỦY BỎ</b> khỏi hệ thống:</p>
              
              <div style="margin-top: 24px; padding: 20px; background-color: #fff1f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px; width: 120px;">📅 <b>Ngày:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">⏰ <b>Ca làm:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.startTime} - ${scheduleData.endTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">📍 <b>Vị trí:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.position || 'staff'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">🏢 <b>Rạp:</b></td>
                    <td style="padding: 8px 0; color: #374151; font-size: 15px;">${scheduleData.theaterName || 'CGV Sense City'}</td>
                  </tr>
                </table>
                <div style="margin-top: 12px;">
                   <img src="https://img.icons8.com/ios-glyphs/30/9ca3af/ellipsis.png" width="20" alt="more"/>
                </div>
              </div>
              
              <p style="margin-top: 24px; color: #6b7280; font-size: 14px; font-style: italic; line-height: 1.6;">
                Bạn không cần có mặt tại rạp vào ca này. Vui lòng kiểm tra lại lịch làm việc mới nhất trên hệ thống để biết thêm chi tiết.
              </p>
            </div>
          </div>
        `
      };
      await sgMail.send(msg);
      console.log(`✅ [Hủy ca] Đã gửi mail thành công tới: ${staff.email}`);
    } catch (error) {
      console.error("❌ Lỗi gửi mail hủy ca:", error.response ? error.response.body : error);
    }
  }
}

export default new EmailService();