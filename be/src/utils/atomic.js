import mongoose from "mongoose";

/**
 * Execute operation with MongoDB transaction
 * @param {Function} operation - Async function to execute within transaction
 * @param {Object} options - Transaction options
 * @returns {Promise} Transaction result
 */
export async function withTransaction(operation, options = {}) {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(operation, {
      readPreference: "primary",
      readConcern: { level: "local" },
      writeConcern: { w: "majority" },
      ...options,
    });

    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Atomic seat hold operation
 * @param {string} scheduleId - Schedule ID
 * @param {Array} seatNumbers - Array of seat numbers
 * @param {string} userId - User ID or Booking ID
 * @param {number} holdMinutes - Hold duration in minutes
 * @returns {Promise<Object>} Updated schedule or null if failed
 */
export async function atomicHoldSeats(scheduleId, seatNumbers, userId, holdMinutes = 10) {
  const Schedule = mongoose.model("Schedule");
  const holdUntil = new Date(Date.now() + holdMinutes * 60 * 1000);

  return await Schedule.findOneAndUpdate(
    {
      _id: scheduleId,
      $and: seatNumbers.map((seatNum) => ({
        seatAvailability: {
          $elemMatch: {
            seatNumber: seatNum,
            isBooked: false,
            $or: [{ holdUntil: { $exists: false } }, { holdUntil: null }, { holdUntil: { $lt: new Date() } }],
          },
        },
      })),
    },
    {
      $set: seatNumbers.reduce((update, seatNum) => {
        update[`seatAvailability.$[seat_${seatNum}].holdUntil`] = holdUntil;
        update[`seatAvailability.$[seat_${seatNum}].bookedBy`] = userId;
        return update;
      }, {}),
    },
    {
      arrayFilters: seatNumbers.map((seatNum) => ({
        [`seat_${seatNum}.seatNumber`]: seatNum,
      })),
      new: true,
    }
  );
}

/**
 * Atomic voucher usage increment
 * @param {string} voucherCode - Voucher code
 * @returns {Promise<Object>} Updated voucher or null if limit exceeded
 */
export async function atomicIncrementVoucherUsage(voucherCode) {
  const Voucher = mongoose.model("Voucher");

  return await Voucher.findOneAndUpdate(
    {
      code: voucherCode.toUpperCase(),
      isActive: true,
      $expr: { $lt: ["$usageCount", "$usageLimit"] },
    },
    {
      $inc: { usageCount: 1 },
    },
    {
      new: true,
    }
  );
}

/**
 * Atomic product stock decrement
 * @param {Array} products - Array of {productId, quantity}
 * @returns {Promise<boolean>} Success status
 */
export async function atomicDecrementProductStock(products) {
  const Product = mongoose.model("Product");

  return await withTransaction(async (session) => {
    for (const item of products) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stockQuantity: { $gte: item.quantity },
          inStock: true,
        },
        {
          $inc: { stockQuantity: -item.quantity },
        },
        { session, new: true }
      );

      if (!result) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      // Update inStock status if quantity reaches 0
      if (result.stockQuantity === 0) {
        await Product.updateOne({ _id: item.productId }, { inStock: false }, { session });
      }
    }

    return true;
  });
}

export default {
  withTransaction,
  atomicHoldSeats,
  atomicIncrementVoucherUsage,
  atomicDecrementProductStock,
};
