import mongoose from "mongoose";
const { Schema } = mongoose;

const staffKPISchema = new Schema(
  {
    // Period
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      required: true,
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

    // Staff info
    staff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },

    // Theater info
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

    // Sales KPIs
    sales: {
      totalTransactions: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      averageTransactionValue: {
        type: Number,
        default: 0,
      },
      ticketsSold: {
        type: Number,
        default: 0,
      },
      productsSold: {
        type: Number,
        default: 0,
      },
      revenueTarget: {
        type: Number,
        default: 0,
      },
      revenueAchievement: {
        type: Number,
        default: 0,
      },
    },

    // Customer Service KPIs
    customerService: {
      customersServed: {
        type: Number,
        default: 0,
      },
      complaintsReceived: {
        type: Number,
        default: 0,
      },
      complaintsResolved: {
        type: Number,
        default: 0,
      },
      resolutionRate: {
        type: Number,
        default: 0,
      },
      averageResolutionTime: {
        type: Number,
        default: 0,
      },
      customerSatisfactionScore: {
        type: Number,
        default: 0,
      },
    },

    // Operational KPIs
    operational: {
      ticketsValidated: {
        type: Number,
        default: 0,
      },
      validationAccuracy: {
        type: Number,
        default: 100,
      },
      duplicateDetections: {
        type: Number,
        default: 0,
      },
      incidentsReported: {
        type: Number,
        default: 0,
      },
      incidentsResolved: {
        type: Number,
        default: 0,
      },
    },

    // Attendance KPIs
    attendance: {
      daysWorked: {
        type: Number,
        default: 0,
      },
      totalHours: {
        type: Number,
        default: 0,
      },
      onTimeRate: {
        type: Number,
        default: 100,
      },
      lateCount: {
        type: Number,
        default: 0,
      },
      absenceCount: {
        type: Number,
        default: 0,
      },
    },

    // Quality KPIs
    quality: {
      errorRate: {
        type: Number,
        default: 0,
      },
      accuracyScore: {
        type: Number,
        default: 100,
      },
      speedScore: {
        type: Number,
        default: 100,
      },
      qualityScore: {
        type: Number,
        default: 100,
      },
    },

    // Overall Performance
    performance: {
      overallScore: {
        type: Number,
        default: 0,
      },
      ranking: {
        type: Number,
      },
      totalStaffCount: {
        type: Number,
      },
      performanceLevel: {
        type: String,
        enum: ["excellent", "good", "average", "below_average", "poor"],
      },
      achievements: [
        {
          title: String,
          description: String,
          date: Date,
        },
      ],
      improvements: [
        {
          area: String,
          suggestion: String,
        },
      ],
    },

    // Targets & Goals
    targets: {
      revenueTarget: {
        type: Number,
        default: 0,
      },
      transactionTarget: {
        type: Number,
        default: 0,
      },
      satisfactionTarget: {
        type: Number,
        default: 4.5,
      },
      attendanceTarget: {
        type: Number,
        default: 95,
      },
    },

    // Status
    status: {
      type: String,
      enum: ["calculating", "completed", "reviewed"],
      default: "calculating",
      index: true,
    },

    // Review
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },

    // Auto-calculated
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
staffKPISchema.index({ staff: 1, period: 1, startDate: -1 });
staffKPISchema.index({ theater: 1, period: 1, startDate: -1 });
staffKPISchema.index({ "performance.overallScore": -1 });

// Pre-save middleware
staffKPISchema.pre("save", function (next) {
  // Calculate resolution rate
  if (this.customerService.complaintsReceived > 0) {
    this.customerService.resolutionRate = Math.round(
      (this.customerService.complaintsResolved / this.customerService.complaintsReceived) * 100
    );
  }

  // Calculate revenue achievement
  if (this.sales.revenueTarget > 0) {
    this.sales.revenueAchievement = Math.round((this.sales.totalRevenue / this.sales.revenueTarget) * 100);
  }

  // Calculate average transaction value
  if (this.sales.totalTransactions > 0) {
    this.sales.averageTransactionValue = Math.round(this.sales.totalRevenue / this.sales.totalTransactions);
  }

  // Calculate overall performance score (weighted average)
  const weights = {
    sales: 0.4,
    customerService: 0.3,
    operational: 0.2,
    attendance: 0.1,
  };

  const salesScore = Math.min(this.sales.revenueAchievement || 0, 100);
  const customerServiceScore = this.customerService.customerSatisfactionScore * 20 || 0;
  const operationalScore = this.operational.validationAccuracy || 0;
  const attendanceScore = this.attendance.onTimeRate || 0;

  this.performance.overallScore = Math.round(
    salesScore * weights.sales +
      customerServiceScore * weights.customerService +
      operationalScore * weights.operational +
      attendanceScore * weights.attendance
  );

  // Determine performance level
  if (this.performance.overallScore >= 90) {
    this.performance.performanceLevel = "excellent";
  } else if (this.performance.overallScore >= 80) {
    this.performance.performanceLevel = "good";
  } else if (this.performance.overallScore >= 70) {
    this.performance.performanceLevel = "average";
  } else if (this.performance.overallScore >= 60) {
    this.performance.performanceLevel = "below_average";
  } else {
    this.performance.performanceLevel = "poor";
  }

  next();
});

// Static methods
staffKPISchema.statics.getStaffKPIs = function (staffId, period, startDate, endDate) {
  const query = {
    staff: staffId,
    status: "completed",
  };

  if (period) query.period = period;
  if (startDate && endDate) {
    query.startDate = { $gte: startDate };
    query.endDate = { $lte: endDate };
  }

  return this.find(query).sort({ startDate: -1 });
};

staffKPISchema.statics.getTheaterRankings = function (theaterId, period, startDate, endDate) {
  return this.find({
    theater: theaterId,
    period,
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
    status: "completed",
  }).sort({ "performance.overallScore": -1 });
};

staffKPISchema.statics.getTopPerformers = function (theaterId, period, limit = 10) {
  return this.find({
    theater: theaterId,
    period,
    status: "completed",
  })
    .sort({ "performance.overallScore": -1 })
    .limit(limit);
};

export default mongoose.model("StaffKPI", staffKPISchema);
