import mongoose from "mongoose";
import cron from "node-cron";
import { BOOKING_CONSTANTS, BOOKING_STATUS } from "../constants/booking.js";
import Booking from "../models/booking.model.js";
import Product from "../models/product.model.js";
import Schedule from "../models/schedule.model.js";
import Voucher from "../models/voucher.model.js";

/**
 *  FIX #6: Service để cleanup expired seat holds và expired bookings
 * Chạy mỗi 5 phút để:
 * 1. Release ghế đã hold quá 10 phút nhưng chưa thanh toán
 * 2. Cancel bookings đã quá 15 phút chưa thanh toán
 * 3. Rollback voucher và product stock
 */
class ExpiredHoldsCleanupService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  start() {
    // Chạy mỗi 5 phút
    this.cronJob = cron.schedule("*/5 * * * *", async () => {
      if (this.isRunning) {
        console.log("⏭️  Cleanup already running, skipping...");
        return;
      }

      try {
        this.isRunning = true;
        await this.cleanup();
      } catch (error) {
        console.error(" Expired holds cleanup error:", error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log(" Expired holds cleanup service scheduled (every 5 minutes)");

    // Chạy ngay lần đầu sau 1 phút
    setTimeout(() => this.cleanup(), 60000);
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log("🛑 Expired holds cleanup service stopped");
    }
  }

  async cleanup() {
    const startTime = Date.now();
    console.log("🧹 Starting expired holds cleanup...");

    try {
      const results = await Promise.all([this.cleanupExpiredSeats(), this.cleanupExpiredBookings()]);

      const [seatsResult, bookingsResult] = results;

      console.log(` Cleanup completed in ${Date.now() - startTime}ms`);
      console.log(`   - Released ${seatsResult.releasedSeats} expired seat holds`);
      console.log(`   - Cancelled ${bookingsResult.cancelledBookings} expired bookings`);
      console.log(`   - Rolled back ${bookingsResult.rolledBackVouchers} vouchers`);
      console.log(`   - Restored ${bookingsResult.restoredProducts} product stocks`);

      return results;
    } catch (error) {
      console.error(" Cleanup error:", error);
      throw error;
    }
  }

  /**
   *  FIX #6: Release ghế đã hold quá thời gian
   */
  async cleanupExpiredSeats() {
    const now = new Date();
    let releasedSeats = 0;

    try {
      //  FIX #13: Tìm schedules có ghế expired với pagination
      let skip = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const schedules = await Schedule.find({
          "seatAvailability.holdUntil": { $lt: now },
          "seatAvailability.isBooked": false,
        })
          .skip(skip)
          .limit(limit)
          .sort({ updatedAt: 1 }); // Process oldest first

        if (schedules.length === 0) {
          hasMore = false;
          break;
        }

        for (const schedule of schedules) {
          const expiredSeats = schedule.seatAvailability.filter(
            (seat) => !seat.isBooked && seat.holdUntil && seat.holdUntil < now
          );

          if (expiredSeats.length > 0) {
            // Release expired seats
            await Schedule.updateOne(
              { _id: schedule._id },
              {
                $set: expiredSeats.reduce((update, seat) => {
                  const index = schedule.seatAvailability.findIndex((s) => s.seatNumber === seat.seatNumber);
                  update[`seatAvailability.${index}.holdUntil`] = null;
                  update[`seatAvailability.${index}.bookedBy`] = null;
                  return update;
                }, {}),
              }
            );

            releasedSeats += expiredSeats.length;
          }
        }

        skip += limit;

        // Nếu số lượng < limit, đã process hết
        if (schedules.length < limit) {
          hasMore = false;
        }

        // Small delay giữa các batch
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      return { releasedSeats };
    } catch (error) {
      console.error("Error cleaning up expired seats:", error);
      return { releasedSeats };
    }
  }

  /**
   *  FIX #6: Cancel bookings quá 15 phút chưa thanh toán
   * Rollback voucher usage và product stock
   */
  async cleanupExpiredBookings() {
    const expiryTime = new Date(Date.now() - BOOKING_CONSTANTS.BOOKING_EXPIRY_MS); // 15 phút trước
    let cancelledBookings = 0;
    let rolledBackVouchers = 0;
    let restoredProducts = 0;

    try {
      //  FIX #12: Tìm bookings expired với pagination để process tất cả
      let skip = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const expiredBookings = await Booking.find({
          status: BOOKING_STATUS.PENDING_PAYMENT,
          createdAt: { $lt: expiryTime },
        })
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: 1 }); // Process oldest first

        if (expiredBookings.length === 0) {
          hasMore = false;
          break;
        }

        for (const booking of expiredBookings) {
          const session = await mongoose.startSession();

          try {
            await session.withTransaction(async () => {
              // 1. Update booking status
              booking.status = BOOKING_STATUS.EXPIRED;
              booking.cancellationReason = "Quá thời gian thanh toán (15 phút)";
              booking.cancelledAt = new Date();
              await booking.save({ session });

              // 2. Release seats
              await Schedule.updateOne(
                {
                  _id: booking.schedule,
                  seatAvailability: { $exists: true, $not: { $size: 0 } }
                },
                {
                  $set: booking.seats.reduce((update, seat, index) => {
                    update[`seatAvailability.$[seat${index}].holdUntil`] = null;
                    update[`seatAvailability.$[seat${index}].bookedBy`] = null;
                    update[`seatAvailability.$[seat${index}].isBooked`] = false;
                    return update;
                  }, {}),
                },
                {
                  arrayFilters: booking.seats.map((seat, index) => ({
                    [`seat${index}.seatNumber`]: seat.seatNumber,
                  })),
                  session,
                }
              );

              // 3.  FIX #8: Rollback voucher usage và remove from usedBy array
              if (booking.appliedVoucher) {
                await Voucher.updateOne(
                  {
                    _id: booking.appliedVoucher,
                  },
                  {
                    $inc: { usageCount: -1 },
                    $pull: {
                      usedBy: {
                        bookingId: booking._id, // Remove entry với bookingId này
                      },
                    },
                  },
                  { session }
                );
                rolledBackVouchers++;
              }

              // 4.  FIX #8: Restore product stock với optimistic locking
              if (booking.products && booking.products.length > 0) {
                for (const item of booking.products) {
                  // Retry logic cho optimistic locking
                  let retries = 3;
                  let restored = false;

                  while (retries > 0 && !restored) {
                    try {
                      const product = await Product.findById(item.product).session(session);

                      if (product) {
                        const currentVersion = product.__v;

                        const updated = await Product.findOneAndUpdate(
                          {
                            _id: item.product,
                            __v: currentVersion, //  Version check
                          },
                          {
                            $inc: {
                              stockQuantity: item.quantity,
                              totalSold: -item.quantity, //  Rollback totalSold
                              __v: 1,
                            },
                            $set: { inStock: true },
                          },
                          {
                            session,
                            new: true,
                          }
                        );

                        if (updated) {
                          restoredProducts++;
                          restored = true;
                        } else {
                          retries--;
                          if (retries > 0) {
                            await new Promise((resolve) => setTimeout(resolve, 50)); // Wait 50ms before retry
                          }
                        }
                      } else {
                        restored = true; // Product deleted, skip
                      }
                    } catch (error) {
                      console.error(`Error restoring product ${item.product}:`, error);
                      retries--;
                    }
                  }

                  if (!restored) {
                    console.warn(`Failed to restore product ${item.product} after 3 retries`);
                  }
                }
              }

              cancelledBookings++;
            });
          } catch (error) {
            console.error(`Error cleaning up booking ${booking._id}:`, error);
          } finally {
            await session.endSession();
          }
        }

        skip += limit;

        // Nếu số lượng < limit, đã process hết
        if (expiredBookings.length < limit) {
          hasMore = false;
        }

        // Small delay giữa các batch để tránh overload
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return { cancelledBookings, rolledBackVouchers, restoredProducts };
    } catch (error) {
      console.error("Error cleaning up expired bookings:", error);
      return { cancelledBookings, rolledBackVouchers, restoredProducts };
    }
  }

  /**
   * Manual cleanup trigger (for testing or admin use)
   */
  async manualCleanup() {
    console.log("🔧 Manual cleanup triggered");
    return await this.cleanup();
  }
}

export default new ExpiredHoldsCleanupService();
