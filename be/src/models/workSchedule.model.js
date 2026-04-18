import mongoose from "mongoose";

const { Schema } = mongoose;

const WorkScheduleSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD

    shiftCode: { type: String }, // Copy code
    shiftName: { type: String }, // Copy name
    startTime: { type: String }, // Copy HH:mm
    endTime: { type: String }, // Copy HH:mm

    theaterId: { type: Schema.Types.ObjectId, ref: "Theater", required: true, index: true },
    shiftTemplateId: { type: Schema.Types.ObjectId, ref: "ShiftTemplate", required: true },
    // optional link to legacy Shift document for backward compatibility
    legacyShiftId: { type: Schema.Types.ObjectId, ref: "Shift", index: true },
    // computed datetimes (UTC)
    startDateTime: { type: Date, required: true, index: true },
    endDateTime: { type: Date, required: true, index: true },
    status: { type: String, enum: ["open", "closed", "cancelled"], default: "open", index: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// prevent duplicate schedule for same theater/date/template
WorkScheduleSchema.index({ theaterId: 1, date: 1, shiftTemplateId: 1 }, { unique: true });

export default mongoose.model("WorkSchedule", WorkScheduleSchema);
