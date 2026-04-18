import mongoose from "mongoose";
const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    // Complaint ID
    complaintId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // Customer info
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    customerName: {
      type: String,
      required: false,
    },
    customerPhone: {
      type: String,
      required: false,
    },
    customerEmail: {
      type: String,
    },

    // Related booking (optional)
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    bookingCode: {
      type: String,
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

    // Complaint details
    category: {
      type: String,
      enum: [
        "service", // Dịch vụ
        "facility", // Cơ sở vật chất
        "ticket", // Vấn đề về vé
        "food", // Đồ ăn/thức uống
        "technical", // Kỹ thuật (âm thanh, hình ảnh)
        "staff", // Nhân viên
        "other", // Khác
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: false,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed", "rejected"],
      default: "pending",
      index: true,
    },

    // Staff handling
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receivedByName: {
      type: String,
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedToName: {
      type: String,
    },

    // Resolution
    resolution: {
      type: String,
      maxlength: 2000,
    },
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

    // Compensation
    compensationType: {
      type: String,
      enum: ["none", "refund", "voucher", "free_ticket", "discount", "other"],
      default: "none",
    },
    compensationAmount: {
      type: Number,
      min: 0,
    },
    compensationDetails: {
      type: String,
    },

    // Customer satisfaction
    customerSatisfied: {
      type: Boolean,
    },
    customerFeedback: {
      type: String,
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Attachments
    attachments: [
      {
        url: String,
        type: String,
        uploadedAt: Date,
      },
    ],

    // Timeline
    timeline: [
      {
        action: String,
        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        performedByName: String,
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notes
    internalNotes: {
      type: String,
    },

    // Escalation
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: String,
      enum: ["supervisor", "manager", "headquarters"],
    },
    escalatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ theater: 1, status: 1, createdAt: -1 });
complaintSchema.index({ receivedBy: 1, status: 1 });
complaintSchema.index({ category: 1, priority: 1 });

// Pre-save middleware
complaintSchema.pre("save", function (next) {
  // Auto-generate complaint ID
  if (!this.complaintId && this.isNew) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.complaintId = `CP${dateStr}${randomStr}`;
  }

  next();
});

// Instance methods
complaintSchema.methods.addTimelineEntry = function (action, performedBy, performedByName, note) {
  this.timeline.push({
    action,
    performedBy,
    performedByName,
    note,
    timestamp: new Date(),
  });
  return this.save();
};

complaintSchema.methods.resolve = function (resolution, resolvedBy, resolvedByName) {
  this.status = "resolved";
  this.resolution = resolution;
  this.resolvedBy = resolvedBy;
  this.resolvedByName = resolvedByName;
  this.resolvedAt = new Date();

  this.timeline.push({
    action: "resolved",
    performedBy: resolvedBy,
    performedByName: resolvedByName,
    note: resolution,
    timestamp: new Date(),
  });

  return this.save();
};

// Static methods
complaintSchema.statics.getPendingComplaints = function (theaterId) {
  return this.find({
    theater: theaterId,
    status: { $in: ["pending", "in_progress"] },
  }).sort({ priority: -1, createdAt: 1 });
};

complaintSchema.statics.getStaffComplaints = function (staffId, status = null) {
  const query = {
    $or: [{ receivedBy: staffId }, { assignedTo: staffId }],
  };

  if (status) {
    query.status = status;
  }

  return this.find(query).sort({ createdAt: -1 });
};

complaintSchema.statics.getComplaintStats = async function (theaterId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        theater: theaterId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          category: "$category",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);
};

export default mongoose.model("Complaint", complaintSchema);
