import mongoose from "mongoose";
const { Schema } = mongoose;

const pointTransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["earn", "redeem", "refund", "bonus", "expire"],
        message: "{VALUE} không phải loại giao dịch hợp lệ",
      },
      required: true,
    },
    points: {
      type: Number,
      required: true,
    }, // Số điểm (+ khi earn, - khi redeem)
    balance: {
      type: Number,
      required: true,
      min: 0,
    }, // Số dư SAU giao dịch
    description: {
      type: String,
      required: true,
      trim: true,
    },
    relatedBooking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    }, // Extra data (bookingCode, movieTitle, etc.)
  },
  {
    timestamps: true,
  }
);

// === INDEXES ===
pointTransactionSchema.index({ user: 1, createdAt: -1 }); // Lịch sử theo thời gian
pointTransactionSchema.index({ user: 1, type: 1 }); // Lọc theo loại
pointTransactionSchema.index({ relatedBooking: 1 }); // Tìm theo booking

// === STATIC METHODS ===

/**
 * Ghi nhận giao dịch điểm
 */
pointTransactionSchema.statics.recordTransaction = async function ({
  userId,
  type,
  points,
  currentBalance,
  description,
  bookingId = null,
  metadata = {},
}) {
  const newBalance = currentBalance + points;

  return this.create({
    user: userId,
    type,
    points,
    balance: Math.max(0, newBalance),
    description,
    relatedBooking: bookingId,
    metadata,
  });
};

/**
 * Lấy lịch sử giao dịch của user
 */
pointTransactionSchema.statics.getUserHistory = function (
  userId,
  { page = 1, limit = 20, type = null } = {}
) {
  const query = { user: userId };
  if (type) query.type = type;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("relatedBooking", "bookingCode movieTitle totalAmount")
    .lean();
};

/**
 * Thống kê điểm tổng hợp
 */
pointTransactionSchema.statics.getUserStats = async function (userId) {
  const result = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$type",
        totalPoints: { $sum: "$points" },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    totalEarned: 0,
    totalRedeemed: 0,
    totalRefunded: 0,
    totalBonus: 0,
    transactionCount: 0,
  };

  result.forEach((r) => {
    stats.transactionCount += r.count;
    switch (r._id) {
      case "earn":
        stats.totalEarned = r.totalPoints;
        break;
      case "redeem":
        stats.totalRedeemed = Math.abs(r.totalPoints);
        break;
      case "refund":
        stats.totalRefunded = r.totalPoints;
        break;
      case "bonus":
        stats.totalBonus = r.totalPoints;
        break;
    }
  });

  return stats;
};

export default mongoose.model("PointTransaction", pointTransactionSchema);
