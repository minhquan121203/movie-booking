import mongoose from "mongoose";
const { Schema } = mongoose;

const dailyReportSchema = new Schema(
  {
    // Report ID
    reportId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // Date & Shift
    reportDate: {
      type: Date,
      required: true,
      index: true,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full_day"],
      required: true,
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

    // Sales metrics
    sales: {
      totalTransactions: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
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
      averageTransactionValue: {
        type: Number,
        default: 0,
      },
    },

    // Payment breakdown
    paymentBreakdown: {
      cash: {
        type: Number,
        default: 0,
      },
      card: {
        type: Number,
        default: 0,
      },
      qr: {
        type: Number,
        default: 0,
      },
      mixed: {
        type: Number,
        default: 0,
      },
    },

    // Customer metrics
    customers: {
      totalCustomers: {
        type: Number,
        default: 0,
      },
      newCustomers: {
        type: Number,
        default: 0,
      },
      returningCustomers: {
        type: Number,
        default: 0,
      },
      guestCustomers: {
        type: Number,
        default: 0,
      },
    },

    // Ticket validation
    validation: {
      totalValidations: {
        type: Number,
        default: 0,
      },
      qrScans: {
        type: Number,
        default: 0,
      },
      manualValidations: {
        type: Number,
        default: 0,
      },
      duplicateAttempts: {
        type: Number,
        default: 0,
      },
    },

    // Issues & Support
    issues: {
      complaintsReceived: {
        type: Number,
        default: 0,
      },
      complaintsResolved: {
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

    // Operational notes
    notes: {
      highlights: {
        type: String,
      },
      challenges: {
        type: String,
      },
      suggestions: {
        type: String,
      },
      maintenanceNeeded: {
        type: String,
      },
    },

    // Attendance
    attendance: {
      checkInTime: {
        type: Date,
      },
      checkOutTime: {
        type: Date,
      },
      hoursWorked: {
        type: Number,
      },
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed", "approved"],
      default: "draft",
      index: true,
    },

    // Review
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedByName: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },

    // Submission
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dailyReportSchema.index({ theater: 1, reportDate: -1 });
dailyReportSchema.index({ staff: 1, reportDate: -1 });
dailyReportSchema.index({ status: 1, reportDate: -1 });

// Pre-save middleware
dailyReportSchema.pre("save", function (next) {
  // Auto-generate report ID
  if (!this.reportId && this.isNew) {
    const date = new Date(this.reportDate);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reportId = `RPT${dateStr}${randomStr}`;
  }

  // Calculate average transaction value
  if (this.sales.totalTransactions > 0) {
    this.sales.averageTransactionValue = Math.round(this.sales.totalRevenue / this.sales.totalTransactions);
  }

  // Calculate hours worked
  if (this.attendance.checkInTime && this.attendance.checkOutTime) {
    const diff = this.attendance.checkOutTime - this.attendance.checkInTime;
    this.attendance.hoursWorked = Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
  }

  next();
});

// Instance methods
dailyReportSchema.methods.submit = function () {
  this.status = "submitted";
  this.submittedAt = new Date();
  return this.save();
};

dailyReportSchema.methods.review = function (reviewedBy, reviewedByName, reviewNotes) {
  this.status = "reviewed";
  this.reviewedBy = reviewedBy;
  this.reviewedByName = reviewedByName;
  this.reviewedAt = new Date();
  this.reviewNotes = reviewNotes;
  return this.save();
};

// Static methods
dailyReportSchema.statics.getStaffReports = function (staffId, startDate, endDate) {
  return this.find({
    staff: staffId,
    reportDate: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ reportDate: -1 });
};

dailyReportSchema.statics.getTheaterReports = function (theaterId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    theater: theaterId,
    reportDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ shift: 1 });
};

dailyReportSchema.statics.getPendingReviews = function (theaterId) {
  return this.find({
    theater: theaterId,
    status: "submitted",
  }).sort({ submittedAt: 1 });
};

export default mongoose.model("DailyReport", dailyReportSchema);
