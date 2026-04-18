import mongoose from "mongoose";

const { Schema } = mongoose;

const ShiftAssignmentSchema = new Schema(
  {
    workScheduleId: { type: Schema.Types.ObjectId, ref: "WorkSchedule", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // optional legacy shift reference
    legacyShiftId: { type: Schema.Types.ObjectId, ref: "Shift", index: true },
    role: { type: String, required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date, default: Date.now },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    actualWorkedMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "active", "completed", "no_show"], default: "pending" },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ShiftAssignmentSchema.index({ userId: 1, workScheduleId: 1 }, { unique: true });

export default mongoose.model("ShiftAssignment", ShiftAssignmentSchema);
