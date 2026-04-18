import Schedule from "../models/schedule.model.js";
import Booking from "../models/booking.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

class DataSyncService {
  constructor() {
    this.syncInterval = 60000; // 1 minute
  }

  /**
   * Start data synchronization jobs
   */
  start() {
    // Sync schedule counts every minute
    setInterval(async () => {
      await this.syncScheduleCounts();
    }, this.syncInterval);

    // Sync product stock every 5 minutes
    setInterval(async () => {
      await this.syncProductStock();
    }, this.syncInterval * 5);

    // Sync user loyalty points every 10 minutes
    setInterval(async () => {
      await this.syncUserLoyaltyPoints();
    }, this.syncInterval * 10);

    console.log("🔄 Data sync service started");
  }

  /**
   * Sync schedule booked seat counts
   */
  async syncScheduleCounts() {
    try {
      const schedules = await Schedule.find({
        status: { $in: ["Đang mở bán vé", "Sắp đầy"] },
      });

      let syncedCount = 0;

      for (const schedule of schedules) {
        const actualBookedCount = schedule.seatAvailability.filter((seat) => seat.isBooked).length;

        if (schedule.bookedSeatsCount !== actualBookedCount) {
          console.warn(`Syncing schedule ${schedule._id}: ${schedule.bookedSeatsCount} -> ${actualBookedCount}`);

          schedule.bookedSeatsCount = actualBookedCount;
          schedule.availableSeatsCount = schedule.totalSeats - actualBookedCount;

          // Update status based on occupancy
          const occupancyRate = (actualBookedCount / schedule.totalSeats) * 100;
          if (occupancyRate >= 100) {
            schedule.status = "Hết vé";
          } else if (occupancyRate >= 80) {
            schedule.status = "Sắp đầy";
          } else {
            schedule.status = "Đang mở bán vé";
          }

          await schedule.save();
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        console.log(`🔄 Synced ${syncedCount} schedule counts`);
      }
    } catch (error) {
      console.error("Sync schedule counts error:", error);
    }
  }

  /**
   * Sync product stock with actual bookings
   */
  async syncProductStock() {
    try {
      const products = await Product.find({ inStock: false });
      let syncedCount = 0;

      for (const product of products) {
        if (product.stockQuantity > 0) {
          product.inStock = true;
          await product.save();
          syncedCount++;
          console.log(`🔄 Restored stock for product ${product.name}`);
        }
      }

      if (syncedCount > 0) {
        console.log(`🔄 Synced ${syncedCount} product stock statuses`);
      }
    } catch (error) {
      console.error("Sync product stock error:", error);
    }
  }

  /**
   * Sync user loyalty points with actual bookings
   */
  async syncUserLoyaltyPoints() {
    try {
      // Find users with recent bookings
      const recentBookings = await Booking.find({
        status: "Hoàn tất",
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      }).populate("customer");

      const userPointsMap = new Map();

      // Calculate expected points
      for (const booking of recentBookings) {
        if (!booking.customer) continue;
        const userId = booking.customer._id.toString();
        const pointsEarned = Math.floor(booking.totalAmount / 10000);

        if (!userPointsMap.has(userId)) {
          userPointsMap.set(userId, {
            user: booking.customer,
            expectedPoints: booking.customer.loyaltyPoints,
            earnedToday: 0,
          });
        }

        userPointsMap.get(userId).earnedToday += pointsEarned;
      }

      // Sync membership levels
      let syncedCount = 0;
      for (const [userId, data] of userPointsMap) {
        const user = data.user;
        const currentLevel = user.membershipLevel;
        let newLevel = currentLevel;

        if (user.loyaltyPoints >= 5000 && currentLevel !== "Bạch kim") {
          newLevel = "Bạch kim";
        } else if (user.loyaltyPoints >= 1000 && currentLevel === "Bạc") {
          newLevel = "Vàng";
        }

        if (newLevel !== currentLevel) {
          user.membershipLevel = newLevel;
          await user.save();
          syncedCount++;
          console.log(`🔄 Updated ${user.email} membership: ${currentLevel} -> ${newLevel}`);
        }
      }

      if (syncedCount > 0) {
        console.log(`🔄 Synced ${syncedCount} user membership levels`);
      }
    } catch (error) {
      console.error("Sync user loyalty points error:", error);
    }
  }

  /**
   * Manual data consistency check
   */
  async manualSync() {
    console.log("🔄 Starting manual data sync...");

    await Promise.all([this.syncScheduleCounts(), this.syncProductStock(), this.syncUserLoyaltyPoints()]);

    console.log("🔄 Manual data sync completed");
  }

  /**
   * Health check for data consistency
   */
  async healthCheck() {
    const issues = [];

    try {
      // Check schedule count consistency
      const schedules = await Schedule.find({});
      for (const schedule of schedules) {
        const actualCount = schedule.seatAvailability.filter((seat) => seat.isBooked).length;
        if (schedule.bookedSeatsCount !== actualCount) {
          issues.push({
            type: "schedule_count_mismatch",
            scheduleId: schedule._id,
            expected: actualCount,
            actual: schedule.bookedSeatsCount,
          });
        }
      }

      // Check product stock consistency
      const products = await Product.find({ inStock: false, stockQuantity: { $gt: 0 } });
      for (const product of products) {
        issues.push({
          type: "product_stock_mismatch",
          productId: product._id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          inStock: product.inStock,
        });
      }

      return {
        healthy: issues.length === 0,
        issues,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

const dataSyncService = new DataSyncService();

export default dataSyncService;
