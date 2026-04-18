import mongoose from "mongoose";
const { Schema } = mongoose;

const voucherSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, "Mã voucher là bắt buộc"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Mã voucher phải có ít nhất 3 ký tự"],
      maxlength: [20, "Mã voucher không được quá 20 ký tự"],
      match: [/^[A-Z0-9]+$/, "Mã voucher chỉ chứa chữ in hoa và số"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Mô tả là bắt buộc"],
      trim: true,
      maxlength: [200, "Mô tả không được quá 200 ký tự"],
    },
    discountType: {
      type: String,
      enum: {
        values: ["fixed", "percent"],
        message: "{VALUE} không phải là loại giảm giá hợp lệ",
      },
      required: [true, "Loại giảm giá là bắt buộc"],
    },
    discountValue: {
      type: Number,
      required: [true, "Giá trị giảm giá là bắt buộc"],
      min: [0, "Giá trị giảm giá không thể âm"],
      validate: {
        validator: function (value) {
          if (this.discountType === "percent") {
            return value <= 100;
          }
          return true;
        },
        message: "Giảm giá phần trăm không được vượt quá 100%",
      },
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, "Số tiền giảm tối đa không thể âm"],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Giá trị đơn hàng tối thiểu không thể âm"],
    },
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu là bắt buộc"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc là bắt buộc"],
      validate: {
        validator: function (endDate) {
          return endDate > this.startDate;
        },
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      },
      index: true,
    },
    usageLimit: {
      type: Number,
      required: [true, "Giới hạn sử dụng là bắt buộc"],
      min: [1, "Giới hạn sử dụng phải lớn hơn 0"],
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
      min: [1, "Giới hạn sử dụng mỗi user phải lớn hơn 0"],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Số lần sử dụng không thể âm"],
    },
    usedBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        bookingId: {
          type: Schema.Types.ObjectId,
          ref: "Booking",
        },
      },
    ],
    applicableFor: {
      type: String,
      enum: ["all", "new_users", "vip_users", "specific_movies"],
      default: "all",
    },
    applicableMovies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    applicableTheaters: [
      {
        type: Schema.Types.ObjectId,
        ref: "Theater",
      },
    ],
    applicableDays: {
      type: [Number], // 0-6 (Sunday-Saturday)
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    membershipLevels: {
      type: [String],
      enum: ["Bạc", "Vàng", "Bạch kim"],
      default: ["Bạc", "Vàng", "Bạch kim"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === INDEXES ===
voucherSchema.index({ code: 1, isActive: 1 });
voucherSchema.index({ startDate: 1, endDate: 1 });
voucherSchema.index({ "usedBy.user": 1 });

// === VIRTUAL FIELDS ===
voucherSchema.virtual("isValid").get(function () {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate && this.usageCount < this.usageLimit;
});

voucherSchema.virtual("remainingUses").get(function () {
  return Math.max(0, this.usageLimit - this.usageCount);
});

voucherSchema.virtual("usagePercentage").get(function () {
  return ((this.usageCount / this.usageLimit) * 100).toFixed(1);
});

// === INSTANCE METHODS ===
voucherSchema.methods.canBeUsedBy = function (userId, userMembershipLevel) {
  // Check if voucher is valid
  if (!this.isValid) return { valid: false, message: "Voucher không hợp lệ" };

  // Check membership level
  if (!this.membershipLevels.includes(userMembershipLevel)) {
    return { valid: false, message: "Voucher không áp dụng cho hạng thành viên của bạn" };
  }

  // Check usage limit per user
  const userUsage = this.usedBy.filter((u) => u.user.toString() === userId.toString()).length;
  if (userUsage >= this.usageLimitPerUser) {
    return { valid: false, message: "Bạn đã sử dụng hết lượt cho voucher này" };
  }

  // Check day of week
  const today = new Date().getDay();
  if (!this.applicableDays.includes(today)) {
    return { valid: false, message: "Voucher không áp dụng cho ngày hôm nay" };
  }

  return { valid: true };
};

voucherSchema.methods.calculateDiscount = function (orderValue) {
  if (this.discountType === "fixed") {
    return Math.min(this.discountValue, orderValue);
  } else {
    const discount = (orderValue * this.discountValue) / 100;
    return this.maxDiscountAmount ? Math.min(discount, this.maxDiscountAmount) : discount;
  }
};

voucherSchema.methods.use = function (userId, bookingId) {
  this.usageCount += 1;
  this.usedBy.push({
    user: userId,
    bookingId: bookingId,
    usedAt: new Date(),
  });
  return this.save();
};

// === STATIC METHODS ===
voucherSchema.statics.findValidVouchers = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $expr: { $lt: ["$usageCount", "$usageLimit"] },
  });
};

export default mongoose.model("Voucher", voucherSchema);
