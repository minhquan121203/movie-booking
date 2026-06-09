import mongoose from "mongoose";
const { Schema } = mongoose;

// Sub-document cho chi tiết thanh toán
const paymentDetailSchema = new Schema({
  paymentMethod: {
    type: String,
    enum: ["pending", "VNPAY", "MoMo", "ZaloPay", "Tại quầy", "Thẻ tín dụng", "bank_transfer"],
    default: "pending",
  },
  transactionId: { type: String }, // Mã giao dịch từ bên thứ 3
  status: {
    type: String,
    enum: [
      "Chờ thanh toán",
      "Thành công",
      "Thất bại",
      "Đã hoàn tiền",
      "Giao dịch treo (Ghế hết)",
      "Hoàn tiền lỗi (Cần thủ công)",
      "Đã hoàn tiền (Auto)",
    ],
    required: true,
  },
  amount: { type: Number, required: true },
  paymentDate: { type: Date },
  paymentInfo: { type: String }, // Thông tin thêm từ gateway
  _id: false,
});

// Sub-document cho sản phẩm được đặt kèm
const orderedProductSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true }, // Denormalize để tránh populate
  quantity: { type: Number, required: true, min: 1 },
  priceAtBooking: { type: Number, required: true }, // Giá tại thời điểm đặt
  size: { type: String, enum: ["S", "M", "L", "XL", "N/A"], default: "N/A" },
  _id: false,
});

// Sub-document cho thông tin ghế đã đặt
const bookedSeatSchema = new Schema({
  seatNumber: { type: String, required: true }, // 'A1', 'B5'
  seatType: {
    type: String,
    enum: ["Thường", "VIP", "Ghế đôi"],
    required: true,
  },
  price: { type: Number, required: true },
  _id: false,
});

const bookingSchema = new Schema(
  {
    // === THÔNG TIN KHÁCH HÀNG ===
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
      // index: true, // Index để query nhanh
      required: false,
    },

    // === THÔNG TIN SUẤT CHIẾU ===
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
      index: true,
    },

    // Denormalized fields để tránh populate nhiều lần
    movieTitle: { type: String, required: true },
    theaterName: { type: String, required: true },
    roomName: { type: String, required: true },
    showDate: { type: Date, required: true },
    showTime: { type: String, required: true }, // "19:30 - 21:30"

    // === THÔNG TIN GHẾ ===
    seats: {
      type: [bookedSeatSchema],
      required: true,
      validate: {
        validator: function (seats) {
          return seats && seats.length > 0;
        },
        message: "Phải chọn ít nhất 1 ghế",
      },
    },

    // === THÔNG TIN SẢN PHẨM KÈM ===
    products: {
      type: [orderedProductSchema],
      default: [],
    },

    // === THÔNG TIN VOUCHER ===
    appliedVoucher: {
      type: Schema.Types.ObjectId,
      ref: "Voucher",
      default: null,
    },
    voucherCode: { type: String }, // Denormalize để dễ tracking

    // === TÍNH TOÁN GIÁ TIỀN ===
    ticketsAmount: {
      type: Number,
      required: true,
      min: 0,
    }, // Tổng tiền vé

    productsAmount: {
      type: Number,
      default: 0,
      min: 0,
    }, // Tổng tiền sản phẩm

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    }, // ticketsAmount + productsAmount

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    }, // Số tiền được giảm

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    }, // subtotal - discountAmount

    // === TRẠNG THÁI ĐẶT VÉ ===
    status: {
      type: String,
      enum: ["Chờ thanh toán", "Hoàn tất", "Đã hủy", "Đã sử dụng", "Hết hạn"],
      default: "Chờ thanh toán",
      index: true,
    },

    // === THÔNG TIN VÉ ĐIỆN TỬ ===
    qrCode: { type: String }, // URL hoặc Base64 của QR code
    bookingCode: {
      type: String,
      unique: true,
      sparse: true, // Chỉ unique khi có giá trị
    }, // Mã đặt vé dạng "BK20251103001"

    // === THÔNG TIN THANH TOÁN ===
    paymentDetails: paymentDetailSchema,

    // === THÔNG TIN TÍCH ĐIỂM ===
    pointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    }, // Số điểm đã dùng để giảm giá
    pointsDiscount: {
      type: Number,
      default: 0,
      min: 0,
    }, // Số tiền giảm từ điểm (VNĐ)
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    }, // Số điểm được cộng sau thanh toán

    // === THÔNG TIN HỦY VÉ ===
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    refundAmount: { type: Number, default: 0 }, // Số tiền hoàn lại

    // === THÔNG TIN BỔ SUNG ===
    notes: { type: String }, // Ghi chú từ khách hàng
    usedAt: { type: Date }, // Thời gian check-in tại rạp

    guestCustomer: {
      name: String,
      email: String,
      phone: String,
      _id: false,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt, updatedAt
  }
);

// === INDEXES ===
bookingSchema.index({ customer: 1, createdAt: -1 }); // Query history
bookingSchema.index({ schedule: 1, status: 1 }); // Check ghế available
// bookingSchema.index({ bookingCode: 1 }); // Tìm vé nhanh (đã được đánh index ở trường dữ liệu)
bookingSchema.index({ "paymentDetails.transactionId": 1 }); // Verify payment

// === VIRTUAL FIELDS ===
bookingSchema.virtual("isExpired").get(function () {
  if (this.status !== "Chờ thanh toán") return false;
  const expiryTime = new Date(this.createdAt.getTime() + 15 * 60 * 1000); // 15 phút
  return new Date() > expiryTime;
});

// === PRE-SAVE MIDDLEWARE ===
bookingSchema.pre("save", function (next) {
  // Tự động tạo booking code
  if (!this.bookingCode && this.isNew) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingCode = `BK${dateStr}${randomStr}`;
  }

  //  FIX #15: Auto-calculate subtotal và totalAmount (bao gồm pointsDiscount)
  this.subtotal = this.ticketsAmount + this.productsAmount;
  this.totalAmount = this.subtotal - this.discountAmount - (this.pointsDiscount || 0);
  // Remove validation check vì đã auto-calculate

  next();
});

// === INSTANCE METHODS ===
bookingSchema.methods.canBeCancelled = function () {
  // Allow cancellation for pending payment or completed bookings
  const allowedStatuses = ["Chờ thanh toán", "Hoàn tất"];
  if (!allowedStatuses.includes(this.status)) return false;

  const showDateTime = new Date(`${this.showDate.toISOString().split("T")[0]} ${this.showTime.split(" - ")[0]}`);
  const hoursUntilShow = (showDateTime - new Date()) / (1000 * 60 * 60);

  // For pending payment, allow cancellation anytime before show
  if (this.status === "Chờ thanh toán") {
    return hoursUntilShow > 0;
  }

  // For completed bookings, must cancel 24h before
  return hoursUntilShow > 24;
};

bookingSchema.methods.calculateRefund = function () {
  if (!this.canBeCancelled()) return 0;
  const showDateTime = new Date(`${this.showDate.toISOString().split("T")[0]} ${this.showTime.split(" - ")[0]}`);
  const hoursUntilShow = (showDateTime - new Date()) / (1000 * 60 * 60);

  if (hoursUntilShow > 48) return this.totalAmount; // Hoàn 100%
  if (hoursUntilShow > 24) return this.totalAmount * 0.7; // Hoàn 70%
  return 0;
};

// === STATIC METHODS ===
bookingSchema.statics.findActiveBookings = function (customerId) {
  return this.find({
    customer: customerId,
    status: { $in: ["Hoàn tất", "Chờ thanh toán"] },
  }).sort({ createdAt: -1 });
};

bookingSchema.statics.getBookingStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: "Hoàn tất",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalTickets: { $sum: { $size: "$seats" } },
        totalBookings: { $sum: 1 },
        avgBookingValue: { $avg: "$totalAmount" },
      },
    },
  ]);
};

export default mongoose.model("Booking", bookingSchema);
