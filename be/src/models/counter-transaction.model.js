import mongoose from "mongoose";
const { Schema } = mongoose;

const counterTransactionSchema = new Schema(
  {
    // Transaction info
    transactionId: {
      type: String,
      unique: true,
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

    // Booking reference
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: function() { return this.transactionType === 'booking'; },
      index: true,
    },

    // Customer info (có thể là guest)
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: "",
    },
    customerEmail: {
      type: String,
    },
    isGuestCustomer: {
      type: Boolean,
      default: false,
    },

    // Transaction details
    movieTitle: {
      type: String,
      required: function() { return this.transactionType === 'booking'; }
    },
    showTime: {
      type: String,
      required: function() { return this.transactionType === 'booking'; }
    },
    seats: [
      {
        seatNumber: String,
        seatType: String,
        price: Number,
      },
    ],
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: String,
        quantity: Number,
        priceAtBooking: Number,
        size: String,
        price: Number, // Legacy support
      },
    ],

    // Payment info
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "qr", "mixed", "bank_transfer", "MoMo", "VNPAY"],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cashReceived: {
      type: Number,
      min: 0,
    },
    changeGiven: {
      type: Number,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ["completed", "cancelled", "refunded"],
      default: "completed",
      index: true,
    },
    
    transactionType: {
        type: String,
        enum: ["booking", "concession"],
        default: "booking",
        index: true
    },

    // Printing info
    ticketPrinted: {
      type: Boolean,
      default: false,
    },
    receiptPrinted: {
      type: Boolean,
      default: false,
    },
    printedAt: {
      type: Date,
    },

    // Notes
    notes: {
      type: String,
    },

    // Shift info
    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
    },

    // Audit
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
counterTransactionSchema.index({ staff: 1, createdAt: -1 });
counterTransactionSchema.index({ theater: 1, createdAt: -1 });
counterTransactionSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware
counterTransactionSchema.pre("save", function (next) {
  // Auto-generate transaction ID if not provided
  if (!this.transactionId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionId = `CT${dateStr}${randomStr}`;
  }

  next();
});

// Static methods
counterTransactionSchema.statics.getStaffTransactions = function (staffId, startDate, endDate) {
  return this.find({
    staff: staffId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    status: "completed",
  }).sort({ createdAt: -1 });
};

counterTransactionSchema.statics.getTheaterTransactions = function (theaterId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    theater: theaterId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: "completed",
  }).sort({ createdAt: -1 });
};

export default mongoose.model("CounterTransaction", counterTransactionSchema);
