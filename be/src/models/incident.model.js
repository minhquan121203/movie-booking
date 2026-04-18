import mongoose from "mongoose";
const { Schema } = mongoose;

const incidentSchema = new Schema(
  {
    // Incident ID
    incidentId: {
      type: String,
      unique: true,
      required: true,
      index: true,
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

    // Location
    location: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
    },

    // Incident details
    type: {
      type: String,
      enum: [
        "technical", // Sự cố kỹ thuật
        "safety", // An toàn
        "security", // An ninh
        "medical", // Y tế
        "fire", // Hỏa hoạn
        "equipment", // Thiết bị
        "customer", // Khách hàng
        "other", // Khác
      ],
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: ["minor", "moderate", "major", "critical"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Reporting
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedByName: {
      type: String,
      required: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ["reported", "acknowledged", "in_progress", "resolved", "closed"],
      default: "reported",
      index: true,
    },

    // Response
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedByName: {
      type: String,
    },
    acknowledgedAt: {
      type: Date,
    },

    // Resolution
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedByName: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolution: {
      type: String,
      maxlength: 2000,
    },

    // Impact
    affectedCustomers: {
      type: Number,
      default: 0,
    },
    affectedSchedules: [
      {
        type: Schema.Types.ObjectId,
        ref: "Schedule",
      },
    ],
    financialImpact: {
      type: Number,
      default: 0,
    },

    // Actions taken
    actionsTaken: [
      {
        action: String,
        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        performedByName: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Follow-up
    requiresFollowUp: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    followUpNotes: {
      type: String,
    },

    // Attachments
    attachments: [
      {
        url: String,
        type: String,
        description: String,
        uploadedAt: Date,
      },
    ],

    // Escalation
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: String,
      enum: ["manager", "headquarters", "emergency_services"],
    },
    escalatedAt: {
      type: Date,
    },

    // Prevention
    preventiveMeasures: {
      type: String,
    },
    rootCause: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
incidentSchema.index({ theater: 1, status: 1, severity: -1 });
incidentSchema.index({ type: 1, reportedAt: -1 });
incidentSchema.index({ reportedBy: 1, reportedAt: -1 });

// Pre-save middleware
incidentSchema.pre("save", function (next) {
  // Auto-generate incident ID
  if (!this.incidentId && this.isNew) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.incidentId = `INC${dateStr}${randomStr}`;
  }

  next();
});

// Instance methods
incidentSchema.methods.acknowledge = function (acknowledgedBy, acknowledgedByName) {
  this.status = "acknowledged";
  this.acknowledgedBy = acknowledgedBy;
  this.acknowledgedByName = acknowledgedByName;
  this.acknowledgedAt = new Date();

  this.actionsTaken.push({
    action: "Incident acknowledged",
    performedBy: acknowledgedBy,
    performedByName: acknowledgedByName,
    timestamp: new Date(),
  });

  return this.save();
};

incidentSchema.methods.resolve = function (resolution, resolvedBy, resolvedByName) {
  this.status = "resolved";
  this.resolution = resolution;
  this.resolvedBy = resolvedBy;
  this.resolvedByName = resolvedByName;
  this.resolvedAt = new Date();

  this.actionsTaken.push({
    action: "Incident resolved",
    performedBy: resolvedBy,
    performedByName: resolvedByName,
    timestamp: new Date(),
  });

  return this.save();
};

incidentSchema.methods.addAction = function (action, performedBy, performedByName) {
  this.actionsTaken.push({
    action,
    performedBy,
    performedByName,
    timestamp: new Date(),
  });

  return this.save();
};

// Static methods
incidentSchema.statics.getActiveIncidents = function (theaterId) {
  return this.find({
    theater: theaterId,
    status: { $in: ["reported", "acknowledged", "in_progress"] },
  }).sort({ severity: -1, reportedAt: 1 });
};

incidentSchema.statics.getCriticalIncidents = function (theaterId) {
  return this.find({
    theater: theaterId,
    severity: { $in: ["major", "critical"] },
    status: { $ne: "closed" },
  }).sort({ reportedAt: -1 });
};

incidentSchema.statics.getIncidentStats = async function (theaterId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        theater: theaterId,
        reportedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          type: "$type",
          severity: "$severity",
        },
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $subtract: ["$resolvedAt", "$reportedAt"],
          },
        },
      },
    },
  ]);
};

export default mongoose.model("Incident", incidentSchema);
