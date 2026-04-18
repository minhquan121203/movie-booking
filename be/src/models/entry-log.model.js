import mongoose from "mongoose";
const { Schema } = mongoose;

const entryLogSchema = new Schema(
  {
    // Booking reference
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    bookingCode: {
      type: String,
      required: true,
      index: true,
    },

    // Customer info
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },

    // Movie & Schedule info
    movie: {
      type: String,
      required: true,
    },
    theater: {
      type: Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
      index: true,
    },
    theaterName: {
      type: String,
      required: true,
    },
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    showDate: {
      type: Date,
      required: true,
      index: true,
    },
    showTime: {
      type: String,
      required: true,
    },

    // Seats
    seats: [
      {
        seatNumber: String,
        seatType: String,
      },
    ],

    // Validation info
    validatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    validatedByName: {
      type: String,
      required: true,
    },
    validatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Validation method
    validationMethod: {
      type: String,
      enum: ["qr_scan", "manual", "booking_code"],
      required: true,
    },

    // Entry status
    entryStatus: {
      type: String,
      enum: ["allowed", "denied", "duplicate"],
      default: "allowed",
      index: true,
    },

    // Duplicate check
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    previousEntryAt: {
      type: Date,
    },

    // Device info
    deviceInfo: {
      deviceId: String,
      deviceType: String,
      ipAddress: String,
    },

    // Notes
    notes: {
      type: String,
    },

    // Issues
    hasIssue: {
      type: Boolean,
      default: false,
    },
    issueDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
entryLogSchema.index({ booking: 1, validatedAt: -1 });
entryLogSchema.index({ theater: 1, showDate: 1 });
entryLogSchema.index({ validatedBy: 1, validatedAt: -1 });

// Static methods
entryLogSchema.statics.checkDuplicateEntry = async function (bookingId) {
  const existingEntry = await this.findOne({
    booking: bookingId,
    entryStatus: "allowed",
  }).sort({ validatedAt: -1 });

  return existingEntry;
};

entryLogSchema.statics.getTheaterEntries = function (theaterId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    theater: theaterId,
    validatedAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ validatedAt: -1 });
};

entryLogSchema.statics.getStaffValidations = function (staffId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    validatedBy: staffId,
    validatedAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ validatedAt: -1 });
};

export default mongoose.model("EntryLog", entryLogSchema);
