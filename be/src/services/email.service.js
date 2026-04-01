import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

class EmailService {
  constructor() {
    // 2. Cấu hình bưu tá Gmail chính chủ
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'quankm1520@gmail.com',
        pass: 'wkghykyxyrifhoqf'
      }
    });

    console.log("✅ Nodemailer (Gmail) initialized");
  }

  // Hàm gửi mail dùng chung
  async send(msg) {
    try {
      const info = await this.transporter.sendMail(msg);
      console.log(`✅ [GMAIL] Email sent: ${info.messageId}`);
      return { success: true };
    } catch (error) {
      console.error("❌ [GMAIL] Send email error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user) {
    const msg = {
      from: `"Cinema Booking" <quankm1520@gmail.com>`,
      to: user.email,
      subject: "Chào mừng đến với Cinema Booking",
      html: this.getWelcomeEmailTemplate(user),
    };
    return await this.send(msg);
  }

  async sendBookingConfirmation(booking, user) {
    const msg = {
      from: `"Cinema Booking" <quankm1520@gmail.com>`,
      to: user.email,
      subject: `Xác nhận đặt vé - ${booking.movieTitle}`,
      html: this.getBookingConfirmationTemplate(booking, user),
      attachments: booking.qrCode ? [
        {
          filename: `ticket-${booking.bookingCode}.png`,
          content: booking.qrCode.split("base64,")[1],
          encoding: 'base64'
        },
      ] : [],
    };
    return await this.send(msg);
  }

  async sendBookingReminder(booking, user) {
    const msg = {
      from: `"Cinema Booking" <quankm1520@gmail.com>`,
      to: user.email,
      subject: `Nhắc nhở: Suất chiếu ${booking.movieTitle} sắp diễn ra`,
      html: this.getBookingReminderTemplate(booking, user),
    };
    return await this.send(msg);
  }

  async sendCancellationEmail(booking, user, refundAmount) {
    const msg = {
      from: `"Cinema Booking" <quankm1520@gmail.com>`,
      to: user.email,
      subject: `Đã hủy vé - ${booking.movieTitle}`,
      html: this.getCancellationEmailTemplate(booking, user, refundAmount),
    };
    return await this.send(msg);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const msg = {
      from: `"Cinema Booking" <quankm1520@gmail.com>`,
      to: user.email,
      subject: "Đặt lại mật khẩu",
      html: this.getPasswordResetTemplate(user, resetUrl),
    };
    return await this.send(msg);
  }

  async sendPromotionalEmail(user, promotion) {
    const msg = {
      from: `"Cinema Booking" <quankm1520@gmail.com>`,
      to: user.email,
      subject: promotion.subject,
      html: this.getPromotionalEmailTemplate(user, promotion),
    };
    return await this.send(msg);
  }

  getWelcomeEmailTemplate(user) {
    return `<!DOCTYPE html><html>... (Nội dung HTML) ...</html>`;
  }

  getBookingConfirmationTemplate(booking, user) {
    return `<!DOCTYPE html><html>... (Nội dung HTML) ...</html>`;
  }

  getBookingReminderTemplate(booking, user) {
    return `<!DOCTYPE html><html>... (Nội dung HTML) ...</html>`;
  }

  getCancellationEmailTemplate(booking, user, refundAmount) {
    return `<!DOCTYPE html><html>... (Nội dung HTML) ...</html>`;
  }

  getPasswordResetTemplate(user, resetUrl) {
    return `<!DOCTYPE html><html>... (Nội dung HTML) ...</html>`;
  }

  getPromotionalEmailTemplate(user, promotion) {
    return `<!DOCTYPE html><html>... (Nội dung HTML) ...</html>`;
  }
}

const emailService = new EmailService();
export default emailService;