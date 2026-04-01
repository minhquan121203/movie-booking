import mongoose from "mongoose";
import nodemailer from "nodemailer";
const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User là bắt buộc"],
        index: true,
      },
      title: {
        type: String,
        required: [true, "Tiêu đề là bắt buộc"],
        trim: true,
        maxlength: [100, "Tiêu đề không được quá 100 ký tự"],
      },
      message: {
        type: String,
        required: [true, "Nội dung là bắt buộc"],
        trim: true,
        maxlength: [500, "Nội dung không được quá 500 ký tự"],
      },
      type: {
        type: String,
        enum: {
          values: [
            "booking_success",
            "booking_cancelled",
            "payment_success",
            "payment_failed",
            "reminder",
            "promotion",
            "system_update",
            "review_approved",
            "review_rejected",
            "loyalty_points",
            "membership_upgrade",
          ],
          message: "{VALUE} không phải là loại thông báo hợp lệ",
        },
        required: true,
        index: true,
      },
      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },
      readAt: Date,
      link: {
        type: String,
        validate: {
          validator: function (url) {
            return !url || /^\//.test(url) || /^https?:\/\/.+/.test(url);
          },
          message: "Link không hợp lệ",
        },
      },
      relatedModel: {
        type: String,
        enum: ["Booking", "Movie", "Review", "User", null],
      },
      relatedId: {
        type: Schema.Types.ObjectId,
      },
      metadata: {
        type: Schema.Types.Mixed,
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      expiresAt: {
        type: Date,
        index: true,
      },
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
      deliveryStatus: {
        inApp: { type: String, enum: ["pending", "delivered", "failed"], default: "pending" },
        email: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
        sms: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

notificationSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual("age").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes > 0) return `${minutes} phút trước`;
  return "Vừa xong";
});

notificationSchema.methods.markAsRead = function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.markAsUnread = function () {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// GỬI MAIL QUA GMAIL
notificationSchema.statics.createNotification = async function (data) {
  const notification = new this(data);
  await notification.save();

  if (data.channels?.email || notification.channels?.email) {
    try {
      const User = (await import("./user.model.js")).default;
      const user = await User.findById(notification.user);

      if (user && user.email) {
        let emailSubject = notification.title || "Thông báo từ CineBooking";

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'quankm1520@gmail.com',
            pass: 'wkghykyxyrifhoq'
          }
        });

        const mailOptions = {
          from: `"CineBooking" <quankm1520@gmail.com>`,
          to: user.email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">🎟️ CineBooking</h1>
              </div>
              <div style="padding: 20px; line-height: 1.6; color: #333;">
                <p>Chào bạn,</p>
                <p style="font-size: 16px;">${notification.message}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Đây là email tự động, vui lòng không phản hồi.</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Mail đã gửi qua Gmail thành công!");

        notification.deliveryStatus.email = "sent";
        await notification.save();
      }
    } catch (emailError) {
      console.error("❌ Lỗi gửi mail qua Gmail:", emailError);
      notification.deliveryStatus.email = "failed";
      await notification.save();
    }
  }
  return notification;
};

notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany({ user: userId, isRead: false }, { isRead: true, readAt: new Date() });
};

notificationSchema.statics.deleteOldNotifications = function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return this.deleteMany({ createdAt: { $lt: cutoffDate }, isRead: true });
};

notificationSchema.statics.templates = {
  bookingSuccess: (booking) => ({
    title: "Đặt vé thành công",
    message: `Bạn đã đặt vé xem ${booking.movieTitle} thành công. Mã vé: ${booking.bookingCode}`,
    type: "booking_success",
    link: `/bookings/${booking._id}`,
    relatedModel: "Booking",
    relatedId: booking._id,
    priority: "high",
  }),
  bookingCancelled: (booking) => ({
    title: "Vé đã được hủy",
    message: `Vé ${booking.bookingCode} đã được hủy. Số tiền hoàn lại: ${booking.refundAmount?.toLocaleString()}đ`,
    type: "booking_cancelled",
    link: `/bookings/${booking._id}`,
    relatedModel: "Booking",
    relatedId: booking._id,
    priority: "medium",
  }),
  paymentSuccess: (booking) => ({
    title: "Thanh toán thành công",
    message: `Thanh toán ${booking.totalAmount?.toLocaleString()}đ cho vé ${booking.bookingCode} thành công`,
    type: "payment_success",
    link: `/bookings/${booking._id}`,
    relatedModel: "Booking",
    relatedId: booking._id,
    priority: "high",
  }),
  paymentFailed: (booking) => ({
    title: "Thanh toán thất bại",
    message: `Thanh toán cho vé ${booking.bookingCode} đã thất bại. Vui lòng thử lại.`,
    type: "payment_failed",
    link: `/bookings/${booking._id}`,
    relatedModel: "Booking",
    relatedId: booking._id,
    priority: "high",
  }),
};

export default mongoose.model("Notification", notificationSchema);