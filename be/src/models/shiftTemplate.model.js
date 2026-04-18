import mongoose from "mongoose";

const { Schema } = mongoose;

const ShiftTemplateSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    // store as HH:mm
    startTime: { type: String, required: true, match: /^([0-1]?\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([0-1]?\d|2[0-3]):[0-5]\d$/ },
    color: { type: String, default: "#2b6cb0" },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ShiftTemplateSchema.index({ code: 1 });

export default mongoose.model("ShiftTemplate", ShiftTemplateSchema);
