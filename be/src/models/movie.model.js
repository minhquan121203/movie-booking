import mongoose from "mongoose";
import { COUNTRIES, LANGUAGES } from "../constants/location.js";
import { generateSlug } from "../utils/slug.js";
const { Schema } = mongoose;

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tên phim là bắt buộc"],
      trim: true,
      minlength: [1, "Tên phim phải có ít nhất 1 ký tự"],
      maxlength: [200, "Tên phim không được quá 200 ký tự"],
      index: true,
    },
    tmdbId: {
        type: Number,
        unique: true,
        sparse: true,
        index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    director: {
      type: String,
      trim: true,
      maxlength: [100, "Tên đạo diễn không được quá 100 ký tự"],
    },
    actors: {
      type: [String],
      validate: {
        validator: function (actors) {
          return actors.every((actor) => actor.length <= 100);
        },
        message: "Tên diễn viên không được quá 100 ký tự",
      },
    },
    duration: {
      type: Number,
      required: [true, "Thời lượng phim là bắt buộc"],
      min: [1, "Thời lượng phải lớn hơn 0"],
      max: [500, "Thời lượng không được quá 500 phút"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Mô tả không được quá 2000 ký tự"],
    },
    posterUrl: {
      type: String,
      validate: {
        validator: function (url) {
          return !url || /^https?:\/\/.+/.test(url);
        },
        message: "URL poster không hợp lệ",
      },
    },
    posterPublicId: {
      type: String, // Cloudinary public ID
    },
    trailerUrl: {
      type: String,
      validate: {
        validator: function (url) {
          return !url || /^https?:\/\/.+/.test(url);
        },
        message: "URL trailer không hợp lệ",
      },
    },
    rating: {
      type: String,
      enum: {
        values: ["P", "C13", "C16", "C18"],
        message: "{VALUE} không phải là rating hợp lệ",
      },
      required: [true, "Rating là bắt buộc"],
    },
    releaseDate: {
      type: Date,
      required: [true, "Ngày phát hành là bắt buộc"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Sắp chiếu", "Đang chiếu", "Ngừng chiếu"],
        message: "{VALUE} không phải là trạng thái hợp lệ",
      },
      required: true,
      default: "Sắp chiếu",
      index: true,
    },
    genres: [
      {
        type: Schema.Types.ObjectId,
        ref: "Genre",
        index: true,
      },
    ],
    language: {
      type: String,
      default: "Tiếng Anh",
      trim: true,
      enum: {
        values: LANGUAGES,
        message: "{VALUE} không phải là ngôn ngữ hợp lệ",
      },
    },
    subtitles: {
      type: [String],
      default: ["Tiếng Việt"],
    },
    country: {
      type: String,
      trim: true,
      enum: {
        values: COUNTRIES,
        message: "{VALUE} không phải là quốc gia hợp lệ",
      },
    },
    ageRestriction: {
      type: Number,
      min: 0,
      max: 18,
    },
    // Statistics
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // SEO
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
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
movieSchema.index({ title: "text", description: "text", director: "text" }, { language_override: "dummy_language_field" });
movieSchema.index({ status: 1, releaseDate: -1 });
movieSchema.index({ genres: 1, status: 1 });
movieSchema.index({ averageRating: -1, totalReviews: -1 });

// === VIRTUAL FIELDS ===
movieSchema.virtual("schedules", {
  ref: "Schedule",
  localField: "_id",
  foreignField: "movie",
});

movieSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "movie",
});

movieSchema.virtual("isUpcoming").get(function () {
  return this.status === "Sắp chiếu";
});

movieSchema.virtual("isNowShowing").get(function () {
  return this.status === "Đang chiếu";
});

movieSchema.virtual("durationFormatted").get(function () {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return `${hours}h ${minutes}m`;
});

// === PRE-SAVE MIDDLEWARE ===
movieSchema.pre("save", function (next) {
  // Auto-generate slug using utility function
  if (this.isModified("title") && !this.slug) {
    const baseSlug = generateSlug(this.title);
    // Nếu slug rỗng do tiêu đề chứa ký tự không được slugify, fallback dùng tmdbId để tránh trùng lặp
    if (baseSlug && baseSlug.length > 0) {
      this.slug = baseSlug;
    } else if (this.tmdbId) {
      this.slug = `tmdb-${this.tmdbId}`;
    } else {
      this.slug = `movie-${Date.now()}`;
    }
  }

  // Auto-update status based on release date
  const now = new Date();
  if (this.releaseDate > now && this.status === "Đang chiếu") {
    this.status = "Sắp chiếu";
  }

  next();
});

// === INSTANCE METHODS ===
movieSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

movieSchema.methods.updateRating = async function () {
  const Review = mongoose.model("Review");
  const stats = await Review.aggregate([
    { $match: { movie: this._id, status: "Đã duyệt" } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    this.averageRating = stats[0].avgRating;
    this.totalReviews = stats[0].count;
    await this.save();
  }
};

// === STATIC METHODS ===
movieSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isDeleted: false });
};

movieSchema.statics.search = function (keyword, options = {}) {
  const query = {
    $text: { $search: keyword },
    isDeleted: false,
  };

  if (options.status) query.status = options.status;
  if (options.genre) query.genres = options.genre;

  return this.find(query)
    .populate("genres", "name")
    .sort({ score: { $meta: "textScore" } });
};

movieSchema.statics.getTopRated = function (limit = 10) {
  return this.find({
    isDeleted: false,
    totalReviews: { $gte: 5 },
  })
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(limit)
    .populate("genres", "name");
};

export default mongoose.model("Movie", movieSchema);
