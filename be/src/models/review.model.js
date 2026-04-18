import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer là bắt buộc"],
      index: true,
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie là bắt buộc"],
      index: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating tối thiểu là 1"],
      max: [5, "Rating tối đa là 5"],
      required: [true, "Rating là bắt buộc"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Bình luận không được quá 1000 ký tự"],
    },
    status: {
      type: String,
      enum: {
        values: ["Chờ duyệt", "Đã duyệt", "Bị từ chối"],
        message: "{VALUE} không phải là trạng thái hợp lệ",
      },
      default: "Chờ duyệt",
      index: true,
    },
    // Likes & Dislikes
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Reports
    reports: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Moderation
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,
    // Verification
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
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
reviewSchema.index({ movie: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, movie: 1 }, { unique: true });
reviewSchema.index({ rating: -1 });

// === VIRTUAL FIELDS ===
reviewSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

reviewSchema.virtual("dislikesCount").get(function () {
  return this.dislikes.length;
});

reviewSchema.virtual("helpfulScore").get(function () {
  return this.likes.length - this.dislikes.length;
});

// === INSTANCE METHODS ===
reviewSchema.methods.like = function (userId) {
  // Remove from dislikes if exists
  this.dislikes = this.dislikes.filter((id) => id.toString() !== userId.toString());

  // Add to likes if not exists
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }

  return this.save();
};

reviewSchema.methods.dislike = function (userId) {
  // Remove from likes if exists
  this.likes = this.likes.filter((id) => id.toString() !== userId.toString());

  // Add to dislikes if not exists
  if (!this.dislikes.includes(userId)) {
    this.dislikes.push(userId);
  }

  return this.save();
};

reviewSchema.methods.report = function (userId, reason) {
  this.reports.push({
    user: userId,
    reason: reason,
    reportedAt: new Date(),
  });
  return this.save();
};

// === POST-SAVE MIDDLEWARE ===
reviewSchema.post("save", async function (doc) {
  // Update movie average rating
  if (doc.status === "Đã duyệt") {
    const Movie = mongoose.model("Movie");
    const movie = await Movie.findById(doc.movie);
    if (movie) {
      await movie.updateRating();
    }
  }
});

// === STATIC METHODS ===
reviewSchema.statics.getMovieReviews = function (movieId, status = "Đã duyệt") {
  return this.find({ movie: movieId, status }).populate("customer", "fullName profilePicture").sort({ createdAt: -1 });
};

export default mongoose.model("Review", reviewSchema);
