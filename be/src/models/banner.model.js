import mongoose from "mongoose";
const { Schema } = mongoose;

const bannerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      maxlength: [100, "Tiêu đề không được quá 100 ký tự"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Phụ đề không được quá 200 ký tự"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Mô tả không được quá 500 ký tự"],
    },
    imageUrl: {
      type: String,
      required: [true, "Hình ảnh là bắt buộc"],
      validate: {
        validator: function (url) {
          return /^https?:\/\/.+/.test(url);
        },
        message: "URL hình ảnh không hợp lệ",
      },
    },
    imagePublicId: {
      type: String, // Cloudinary public ID
    },
    // Mobile version
    mobileImageUrl: {
      type: String,
    },
    mobileImagePublicId: {
      type: String,
    },
    // Link
    linkUrl: {
      type: String,
      validate: {
        validator: function (url) {
          return !url || /^\//.test(url) || /^https?:\/\/.+/.test(url);
        },
        message: "URL link không hợp lệ",
      },
    },
    linkTarget: {
      type: String,
      enum: ["_self", "_blank"],
      default: "_self",
    },
    // CTA Button
    ctaText: {
      type: String,
      trim: true,
      maxlength: [50, "Text CTA không được quá 50 ký tự"],
    },
    ctaColor: {
      type: String,
      match: [/^#[0-9A-F]{6}$/i, "Mã màu không hợp lệ"],
    },
    // Display settings
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    position: {
      type: String,
      enum: {
        values: ["home_slider", "home_top", "movie_detail", "booking_page", "sidebar"],
        message: "{VALUE} không phải là vị trí hợp lệ",
      },
      default: "home_slider",
      index: true,
    },
    // Scheduling
    startDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    // Targeting
    targetAudience: {
      type: String,
      enum: ["all", "new_users", "members", "vip_members"],
      default: "all",
    },
    targetCities: [String],
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    // Related content
    relatedMovie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
    },
    relatedVoucher: {
      type: Schema.Types.ObjectId,
      ref: "Voucher",
    },
    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === INDEXES ===
bannerSchema.index({ position: 1, displayOrder: 1 });
bannerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
bannerSchema.index({ views: -1, clicks: -1 });

// === VIRTUAL FIELDS ===
bannerSchema.virtual("isScheduledActive").get(function () {
  const now = new Date();
  if (!this.startDate || now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return this.isActive;
});

bannerSchema.virtual("ctr").get(function () {
  if (this.views === 0) return 0;
  return ((this.clicks / this.views) * 100).toFixed(2);
});

bannerSchema.virtual("daysRemaining").get(function () {
  if (!this.endDate) return null;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// === INSTANCE METHODS ===
bannerSchema.methods.recordView = function () {
  this.views += 1;
  return this.save();
};

bannerSchema.methods.recordClick = function () {
  this.clicks += 1;
  return this.save();
};

// === STATIC METHODS ===
bannerSchema.statics.getActiveBanners = function (position = "home_slider") {
  const now = new Date();
  return this.find({
    position,
    isActive: true,
    $or: [{ startDate: null }, { startDate: { $lte: now } }],
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  })
    .sort({ displayOrder: 1 })
    .populate("relatedMovie", "title posterUrl slug")
    .populate("relatedVoucher", "code description");
};

bannerSchema.statics.getBestPerforming = function (limit = 10) {
  return this.find({ isActive: true }).sort({ clicks: -1, views: -1 }).limit(limit);
};

bannerSchema.statics.expireOldBanners = function () {
  const now = new Date();
  return this.updateMany(
    {
      endDate: { $lt: now },
      isActive: true,
    },
    {
      isActive: false,
    }
  );
};

export default mongoose.model("Banner", bannerSchema);
