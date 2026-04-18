import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
      index: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shiftType: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full-day"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: ["cashier", "usher", "projectionist", "manager", "cleaner", "security"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    checkIn: {
      time: Date,
      location: {
        type: { type: String, default: "Point" },
        coordinates: [Number],
      },
      method: {
        type: String,
        enum: ["manual", "qr-code", "biometric", "mobile-app"],
      },
    },
    checkOut: {
      time: Date,
      location: {
        type: { type: String, default: "Point" },
        coordinates: [Number],
      },
      method: {
        type: String,
        enum: ["manual", "qr-code", "biometric", "mobile-app"],
      },
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    scheduledHours: {
      type: Number,
      required: true,
    },
    overtime: {
      hours: { type: Number, default: 0 },
      approved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    break: {
      scheduled: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
    },
    notes: String,
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    swapRequest: {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
  }
);

shiftSchema.index({ theater: 1, date: 1 });
shiftSchema.index({ staff: 1, date: 1 });
shiftSchema.index({ date: 1, status: 1 });

shiftSchema.methods.calculateActualHours = function () {
  if (this.checkIn?.time && this.checkOut?.time) {
    const hours = (this.checkOut.time - this.checkIn.time) / (1000 * 60 * 60);
    this.actualHours = Math.max(0, hours - (this.break.actual || 0));

    if (this.actualHours > this.scheduledHours) {
      this.overtime.hours = this.actualHours - this.scheduledHours;
    }
  }
};

export default mongoose.model("Shift", shiftSchema);
