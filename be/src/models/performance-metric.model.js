import mongoose from "mongoose";

const performanceMetricSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["theater", "staff", "movie", "schedule"],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ["hourly", "daily", "weekly", "monthly"],
      required: true,
    },
    metrics: {
      revenue: {
        total: { type: Number, default: 0 },
        target: { type: Number, default: 0 },
        achievement: { type: Number, default: 0 },
      },
      attendance: {
        count: { type: Number, default: 0 },
        target: { type: Number, default: 0 },
        achievement: { type: Number, default: 0 },
      },
      efficiency: {
        score: { type: Number, default: 0 },
        factors: {
          speed: Number,
          accuracy: Number,
          quality: Number,
        },
      },
      customerSatisfaction: {
        rating: { type: Number, default: 0 },
        reviews: { type: Number, default: 0 },
        complaints: { type: Number, default: 0 },
      },
      operational: {
        uptime: { type: Number, default: 100 },
        incidents: { type: Number, default: 0 },
        maintenanceTime: { type: Number, default: 0 },
      },
    },
    kpis: [
      {
        name: String,
        value: Number,
        target: Number,
        unit: String,
        status: {
          type: String,
          enum: ["excellent", "good", "average", "poor", "critical"],
        },
      },
    ],
    trends: {
      direction: {
        type: String,
        enum: ["up", "down", "stable"],
      },
      percentage: Number,
      comparison: String,
    },
    alerts: [
      {
        type: {
          type: String,
          enum: ["warning", "critical", "info"],
        },
        message: String,
        threshold: Number,
        actualValue: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

performanceMetricSchema.index({ entityType: 1, entityId: 1, date: -1 });
performanceMetricSchema.index({ date: 1, period: 1 });

export default mongoose.model("PerformanceMetric", performanceMetricSchema);
