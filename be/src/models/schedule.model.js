import mongoose from "mongoose";
const { Schema } = mongoose;

// Sub-document để track trạng thái ghế cho suất chiếu cụ thể
const seatAvailabilitySchema = new Schema({
  seatNumber: { type: String, required: true },
  seatType: { type: String, enum: ["Thường", "VIP", "Ghế đôi"], required: true },
  isBooked: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true }, // Thêm trường này giống trong DB
  row: { type: String },    // Thêm trường này để vẽ map
  column: { type: Number }, // Thêm trường này để vẽ map
  bookedBy: { type: Schema.Types.ObjectId },
  holderType: { type: String, enum: ["user", "booking"], default: "user" },
  holdUntil: { type: Date },
  _id: false,
});

const scheduleSchema = new Schema(
  {
    // === THÔNG TIN PHIM ===
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },

    // === THÔNG TIN RẠP & PHÒNG ===
    theater: {
      type: Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
      index: true,
    },
    room: {
      //  THIẾU QUAN TRỌNG trong version cũ
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    roomType: {
      type: String,
      enum: ["2D", "3D", "IMAX"],
      required: true,
    },

    // === THÔNG TIN THỜI GIAN ===
    showDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // Validate format HH:mm
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    // === GIÁ VÉ ===
    ticketPrices: {
      standard: {
        type: Number,
        required: true,
        min: 0,
      },
      vip: {
        type: Number,
        min: 0,
      },
      couple: {
        type: Number,
        min: 0,
      },
    },

    // === TRẠNG THÁI GHẾ ===
    seatAvailability: [seatAvailabilitySchema],
    totalSeats: { type: Number, required: true },
    bookedSeatsCount: { type: Number, default: 0 },
    availableSeatsCount: { type: Number },

    // === TRẠNG THÁI SUẤT CHIẾU ===
    status: {
      type: String,
      enum: ["Sắp chiếu", "Đang mở bán vé", "Sắp đầy", "Hết vé", "Đã chiếu", "Đã hủy"],
      default: "Đang mở bán vé",
      index: true,
    },

    // === BỔ SUNG THÔNG TIN ===
    language: { type: String, default: "Tiếng Anh" }, // Ngôn ngữ phim
    subtitles: { type: [String], default: ["Tiếng Việt"] }, // Phụ đề

    // === AUDIT FIELDS ===
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
    //  FIX #7: Enable optimistic locking với version control
    versionKey: "__v",
    optimisticConcurrency: true,
  }
);

// === COMPOUND INDEXES ===
scheduleSchema.index({ movie: 1, showDate: 1, startTime: 1 });
scheduleSchema.index({ theater: 1, room: 1, showDate: 1 });
scheduleSchema.index({ showDate: 1, status: 1 });

// === VIRTUAL FIELDS ===
scheduleSchema.virtual("occupancyRate").get(function () {
  if (this.totalSeats === 0) return 0;
  return ((this.bookedSeatsCount / this.totalSeats) * 100).toFixed(2);
});

scheduleSchema.virtual("isAlmostFull").get(function () {
  return this.occupancyRate >= 80;
});

// === PRE-SAVE MIDDLEWARE ===
scheduleSchema.pre("save", function (next) {
  // Ensure bookedSeatsCount is always accurate
  if (this.seatAvailability && this.seatAvailability.length > 0) {
    const actualBookedCount = this.seatAvailability.filter((seat) => seat.isBooked).length;
    if (this.bookedSeatsCount !== actualBookedCount) {
      console.warn(`Fixing bookedSeatsCount mismatch: ${this.bookedSeatsCount} -> ${actualBookedCount}`);
      this.bookedSeatsCount = actualBookedCount;
    }
  }

  // Tự động cập nhật availableSeatsCount
  this.availableSeatsCount = this.totalSeats - this.bookedSeatsCount;

  // Tự động cập nhật status dựa trên số ghế
  if (this.availableSeatsCount === 0) {
    this.status = "Hết vé";
  } else if (this.occupancyRate >= 80) {
    this.status = "Sắp đầy";
  } else if (this.status === "Hết vé" || this.status === "Sắp đầy") {
    this.status = "Đang mở bán vé";
  }

  // Kiểm tra xem suất chiếu đã qua chưa
  const now = new Date();
  const showDateTime = new Date(`${this.showDate.toISOString().split("T")[0]} ${this.endTime}`);
  if (now > showDateTime && this.status !== "Đã hủy") {
    this.status = "Đã chiếu";
  }

  next();
});

// === INSTANCE METHODS ===
// Unified hold method with type specification
scheduleSchema.methods.holdSeats = function (seatNumbers, holderId, holdMinutes = 10, holderType = "user", session) {
  const holdUntil = new Date(Date.now() + holdMinutes * 60 * 1000);

  seatNumbers.forEach((seatNum) => {
    const seat = this.seatAvailability.find((s) => s.seatNumber === seatNum);
    if (seat && !seat.isBooked) {
      seat.holdUntil = holdUntil;
      seat.bookedBy = holderId;
      seat.holderType = holderType; // 'user' or 'booking'
    }
  });

  if (session) return this.save({ session });
  return this.save();
};

// Backward compatibility methods
scheduleSchema.methods.holdSeatsForUser = function (seatNumbers, userId, holdMinutes = 10) {
  return this.holdSeats(seatNumbers, userId, holdMinutes, "user");
};

scheduleSchema.methods.holdSeatsForBooking = function (seatNumbers, bookingId, holdMinutes = 10) {
  return this.holdSeats(seatNumbers, bookingId, holdMinutes, "booking");
};

scheduleSchema.methods.confirmSeats = function (seatNumbers, bookingId, session) {
  seatNumbers.forEach((seatNum) => {
    const seat = this.seatAvailability.find((s) => s.seatNumber === seatNum);
    if (seat) {
      seat.isBooked = true;
      seat.bookedBy = bookingId; // Lưu Booking ID khi confirm
      seat.holdUntil = null;
    }
  });

  // Calculate actual booked count instead of manual increment
  this.bookedSeatsCount = this.seatAvailability.filter((seat) => seat.isBooked).length;
  if (session) return this.save({ session });
  return this.save();
};

scheduleSchema.methods.releaseSeats = function (seatNumbers, session) {
  seatNumbers.forEach((seatNum) => {
    const seat = this.seatAvailability.find((s) => s.seatNumber === seatNum);
    if (seat) {
      seat.isBooked = false;
      seat.bookedBy = null;
      seat.holdUntil = null;
    }
  });

  // Calculate actual booked count instead of manual decrement
  this.bookedSeatsCount = this.seatAvailability.filter((seat) => seat.isBooked).length;
  if (session) return this.save({ session });
  return this.save();
};

scheduleSchema.methods.releaseExpiredHolds = function (session) {
  const now = new Date();
  let releasedCount = 0;

  this.seatAvailability.forEach((seat) => {
    if (seat.holdUntil && seat.holdUntil < now && !seat.isBooked) {
      seat.holdUntil = null;
      seat.bookedBy = null;
      releasedCount++;
    }
  });

  if (releasedCount > 0) {
    if (session) return this.save({ session });
    return this.save();
  }
  return Promise.resolve(this);
};

// === STATIC METHODS ===
scheduleSchema.statics.findAvailableSchedules = function (movieId, date) {
  return this.find({
    movie: movieId,
    showDate: {
      $gte: new Date(date).setHours(0, 0, 0),
      $lt: new Date(date).setHours(23, 59, 59),
    },
    status: { $in: ["Đang mở bán vé", "Sắp đầy"] },
  }).sort({ startTime: 1 });
};

scheduleSchema.statics.checkRoomConflict = async function (
  theaterId,
  roomId,
  showDate,
  startTime,
  endTime,
  excludeScheduleId
) {
  const query = {
    theater: theaterId,
    room: roomId,
    showDate: showDate,
    status: { $ne: "Đã hủy" },
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
  };

  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const conflict = await this.findOne(query);
  return !!conflict;
};

export default mongoose.model("Schedule", scheduleSchema);
