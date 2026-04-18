import mongoose from "mongoose";

const analyticsReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "revenue",
        "attendance",
        "staff-performance",
        "movie-performance",
        "theater-performance",
        "customer-satisfaction",
      ],
      required: true,
      index: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    data: {
      revenue: {
        total: { type: Number, default: 0 },
        tickets: { type: Number, default: 0 },
        products: { type: Number, default: 0 },
        online: { type: Number, default: 0 },
        counter: { type: Number, default: 0 },
        growth: { type: Number, default: 0 },
      },
      attendance: {
        totalTickets: { type: Number, default: 0 },
        totalCustomers: { type: Number, default: 0 },
        occupancyRate: { type: Number, default: 0 },
        peakHours: [String],
        averagePerShow: { type: Number, default: 0 },
      },
      movies: [
        {
          movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
          revenue: Number,
          tickets: Number,
          shows: Number,
          rating: Number,
          occupancy: Number,
        },
      ],
      staff: [
        {
          staff: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          hoursWorked: Number,
          shiftsCompleted: Number,
          kpiScore: Number,
          performance: String,
        },
      ],
      theaters: [
        {
          theater: { type: mongoose.Schema.Types.ObjectId, ref: "Theater" },
          revenue: Number,
          tickets: Number,
          occupancy: Number,
          shows: Number,
        },
      ],
      customerSatisfaction: {
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        complaints: { type: Number, default: 0 },
        compliments: { type: Number, default: 0 },
        nps: { type: Number, default: 0 },
      },
    },
    insights: [
      {
        type: {
          type: String,
          enum: ["trend", "anomaly", "recommendation", "alert", "achievement"],
        },
        title: String,
        description: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        actionable: Boolean,
      },
    ],
    comparisons: {
      previousPeriod: {
        revenue: Number,
        attendance: Number,
        growth: Number,
      },
      yearOverYear: {
        revenue: Number,
        attendance: Number,
        growth: Number,
      },
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["generating", "completed", "failed"],
      default: "generating",
    },
    metadata: {
      generationTime: Number,
      dataPoints: Number,
      version: String,
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

analyticsReportSchema.index({ reportType: 1, category: 1, startDate: -1 });
analyticsReportSchema.index({ theater: 1, startDate: -1 });

export default mongoose.model("AnalyticsReport", analyticsReportSchema);
