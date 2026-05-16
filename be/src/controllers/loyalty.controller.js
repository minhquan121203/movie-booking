import mongoose from "mongoose";
import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";
import PointTransaction from "../models/point-transaction.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

/**
 * Quy tắc tích/đổi điểm theo hạng thành viên
 */
const LOYALTY_CONFIG = {
  // Tỉ lệ TÍCH điểm (bao nhiêu VNĐ = 1 điểm)
  earnRate: {
    "Bạc": 10000,       // 1 điểm / 10.000đ
    "Vàng": 8000,       // 1 điểm / 8.000đ  (+25% earn rate)
    "Kim Cương": 5000,  // 1 điểm / 5.000đ  (+100% earn rate)
  },
  // Tỉ lệ ĐỔI điểm (1 điểm = bao nhiêu VNĐ)
  redeemRate: {
    "Bạc": 500,         // 1 điểm = 500đ
    "Vàng": 600,        // 1 điểm = 600đ
    "Kim Cương": 800,   // 1 điểm = 800đ
  },
  // Giới hạn
  maxRedeemPercent: 50, // Tối đa dùng 50% tổng tiền bằng điểm
  minRedeemPoints: 10,  // Tối thiểu dùng 10 điểm
  // Ngưỡng nâng hạng
  levelThresholds: {
    "Vàng": 500,       // ~5.000.000đ chi tiêu
    "Kim Cương": 1125,  // ~10.000.000đ chi tiêu
  },
};

const loyaltyController = {
  /**
   * GET /api/loyalty/me
   * Xem thông tin điểm + hạng + config
   */
  getMyLoyalty: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select(
        "loyaltyPoints membershipLevel fullName"
      );
      if (!user) return errorResponse(res, "Không tìm thấy người dùng", 404);

      const level = user.membershipLevel || "Bạc";
      const points = user.loyaltyPoints || 0;

      // Lấy thống kê (totalEarned, totalRedeemed, ...)
      const stats = await PointTransaction.getUserStats(req.userId);
      const totalEarned = (stats.totalEarned || 0) + (stats.totalBonus || 0) + (stats.totalRefunded || 0);

      // Tính điểm cần để nâng hạng tiếp theo (dựa trên TỔNG ĐIỂM ĐÃ TÍCH, không phải điểm hiện tại)
      let nextLevel = null;
      let pointsToNextLevel = 0;
      if (level === "Bạc") {
        nextLevel = "Vàng";
        pointsToNextLevel = Math.max(0, LOYALTY_CONFIG.levelThresholds["Vàng"] - totalEarned);
      } else if (level === "Vàng") {
        nextLevel = "Kim Cương";
        pointsToNextLevel = Math.max(0, LOYALTY_CONFIG.levelThresholds["Kim Cương"] - totalEarned);
      }

      return successResponse(res, {
        points,
        totalEarned,
        level,
        earnRate: LOYALTY_CONFIG.earnRate[level],
        redeemRate: LOYALTY_CONFIG.redeemRate[level],
        maxRedeemPercent: LOYALTY_CONFIG.maxRedeemPercent,
        minRedeemPoints: LOYALTY_CONFIG.minRedeemPoints,
        nextLevel,
        pointsToNextLevel,
        progress: nextLevel
          ? Math.min(100, Math.round((totalEarned / LOYALTY_CONFIG.levelThresholds[nextLevel]) * 100))
          : 100,
        stats,
      });
    } catch (error) {
      console.error("Get loyalty error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  /**
   * GET /api/loyalty/history
   * Lịch sử giao dịch điểm
   */
  getHistory: async (req, res) => {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const pageNum = Math.max(parseInt(page) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

      const query = { user: req.userId };
      if (type && ["earn", "redeem", "refund", "bonus", "expire"].includes(type)) {
        query.type = type;
      }

      // Auto-backfill: nếu user có điểm nhưng chưa có record nào → tạo từ booking cũ
      const existingCount = await PointTransaction.countDocuments({ user: req.userId });
      if (existingCount === 0) {
        try {
          const Booking = (await import("../models/booking.model.js")).default;
          const completedBookings = await Booking.find({
            customer: req.userId,
            status: { $in: ["Hoàn tất", "Đã sử dụng"] },
          }).sort({ createdAt: 1 }).lean();

          const user = await User.findById(req.userId).select("loyaltyPoints").lean();

          for (const booking of completedBookings) {
            const pointsEarned = booking.pointsEarned || Math.floor((booking.totalAmount || 0) / 10000);
            if (pointsEarned <= 0) continue;

            await PointTransaction.create({
              user: req.userId,
              type: "earn",
              points: pointsEarned,
              balance: user?.loyaltyPoints || 0,
              description: `Tích điểm từ vé ${booking.bookingCode} - ${booking.movieTitle || "Phim"}`,
              relatedBooking: booking._id,
              metadata: { movieTitle: booking.movieTitle, totalAmount: booking.totalAmount, backfilled: true },
              createdAt: booking.createdAt,
            });

            if (booking.pointsUsed > 0) {
              await PointTransaction.create({
                user: req.userId,
                type: "redeem",
                points: -booking.pointsUsed,
                balance: user?.loyaltyPoints || 0,
                description: `Đổi điểm giảm ${booking.pointsDiscount?.toLocaleString("vi-VN")}đ cho vé ${booking.bookingCode}`,
                relatedBooking: booking._id,
                metadata: { pointsDiscount: booking.pointsDiscount, backfilled: true },
                createdAt: booking.createdAt,
              });
            }
          }
        } catch (backfillErr) {
          console.error("Auto-backfill error:", backfillErr);
        }
      }

      const [transactions, total] = await Promise.all([
        PointTransaction.find(query)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .populate("relatedBooking", "bookingCode movieTitle totalAmount")
          .lean(),
        PointTransaction.countDocuments(query),
      ]);

      return successResponse(res, {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get loyalty history error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  /**
   * POST /api/loyalty/preview
   * Preview: dùng X điểm → giảm bao nhiêu tiền
   */
  previewRedeem: async (req, res) => {
    try {
      const { pointsToUse, subtotal } = req.body;

      if (!pointsToUse || pointsToUse < 0) {
        return errorResponse(res, "Số điểm không hợp lệ", 400);
      }

      const user = await User.findById(req.userId).select("loyaltyPoints membershipLevel");
      if (!user) return errorResponse(res, "Không tìm thấy người dùng", 404);

      const level = user.membershipLevel || "Bạc";
      const availablePoints = user.loyaltyPoints || 0;

      // Validate
      if (pointsToUse > availablePoints) {
        return errorResponse(res, `Bạn chỉ có ${availablePoints} điểm`, 400);
      }
      if (pointsToUse < LOYALTY_CONFIG.minRedeemPoints) {
        return errorResponse(res, `Tối thiểu dùng ${LOYALTY_CONFIG.minRedeemPoints} điểm`, 400);
      }

      // Tính tiền giảm
      const redeemRate = LOYALTY_CONFIG.redeemRate[level];
      let discount = pointsToUse * redeemRate;

      // Giới hạn tối đa 50% subtotal
      if (subtotal) {
        const maxDiscount = Math.floor(subtotal * LOYALTY_CONFIG.maxRedeemPercent / 100);
        if (discount > maxDiscount) {
          discount = maxDiscount;
          // Tính lại số điểm thực tế cần dùng
          const actualPoints = Math.ceil(maxDiscount / redeemRate);
          return successResponse(res, {
            pointsToUse: actualPoints,
            discount: maxDiscount,
            redeemRate,
            note: `Giới hạn ${LOYALTY_CONFIG.maxRedeemPercent}% tổng tiền. Chỉ cần dùng ${actualPoints} điểm.`,
          });
        }
      }

      return successResponse(res, {
        pointsToUse,
        discount,
        redeemRate,
        remainingPoints: availablePoints - pointsToUse,
      });
    } catch (error) {
      console.error("Preview redeem error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  /**
   * GET /api/loyalty/config
   * Lấy cấu hình loyalty (public)
   */
  getConfig: async (req, res) => {
    try {
      return successResponse(res, {
        earnRate: LOYALTY_CONFIG.earnRate,
        redeemRate: LOYALTY_CONFIG.redeemRate,
        maxRedeemPercent: LOYALTY_CONFIG.maxRedeemPercent,
        minRedeemPoints: LOYALTY_CONFIG.minRedeemPoints,
        levelThresholds: LOYALTY_CONFIG.levelThresholds,
        levels: [
          { name: "Bạc", icon: "🥈", threshold: 0, color: "#C0C0C0" },
          { name: "Vàng", icon: "🥇", threshold: 500, color: "#FFD700" },
          { name: "Kim Cương", icon: "💎", threshold: 1125, color: "#B9F2FF" },
        ],
      });
    } catch (error) {
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  /**
   * POST /api/loyalty/backfill
   * Backfill lịch sử điểm từ booking đã hoàn tất (chạy 1 lần)
   */
  backfillHistory: async (req, res) => {
    try {
      const Booking = (await import("../models/booking.model.js")).default;

      // Tìm tất cả booking hoàn tất mà chưa có PointTransaction
      const completedBookings = await Booking.find({
        status: { $in: ["Hoàn tất", "Đã sử dụng"] },
        customer: { $exists: true, $ne: null },
      })
        .populate("customer", "loyaltyPoints membershipLevel")
        .sort({ createdAt: 1 })
        .lean();

      let created = 0;
      let skipped = 0;

      for (const booking of completedBookings) {
        if (!booking.customer) { skipped++; continue; }

        // Kiểm tra đã có PointTransaction cho booking này chưa
        const exists = await PointTransaction.findOne({
          relatedBooking: booking._id,
          type: "earn",
        });
        if (exists) { skipped++; continue; }

        const pointsEarned = booking.pointsEarned || Math.floor((booking.totalAmount || 0) / 10000);
        if (pointsEarned <= 0) { skipped++; continue; }

        // Tạo record earn
        await PointTransaction.create({
          user: booking.customer._id,
          type: "earn",
          points: pointsEarned,
          balance: booking.customer.loyaltyPoints || 0,
          description: `Tích điểm từ vé ${booking.bookingCode} - ${booking.movieTitle || "Phim"}`,
          relatedBooking: booking._id,
          metadata: { movieTitle: booking.movieTitle, totalAmount: booking.totalAmount, backfilled: true },
          createdAt: booking.createdAt,
        });
        created++;

        // Nếu booking có dùng điểm
        if (booking.pointsUsed > 0) {
          await PointTransaction.create({
            user: booking.customer._id,
            type: "redeem",
            points: -booking.pointsUsed,
            balance: booking.customer.loyaltyPoints || 0,
            description: `Đổi điểm giảm ${booking.pointsDiscount?.toLocaleString("vi-VN")}đ cho vé ${booking.bookingCode}`,
            relatedBooking: booking._id,
            metadata: { pointsDiscount: booking.pointsDiscount, backfilled: true },
            createdAt: booking.createdAt,
          });
          created++;
        }
      }

      return successResponse(res, {
        totalBookings: completedBookings.length,
        created,
        skipped,
      }, `Backfill hoàn tất: tạo ${created} records, bỏ qua ${skipped} bookings`);
    } catch (error) {
      console.error("Backfill error:", error);
      return errorResponse(res, "Lỗi backfill: " + error.message, 500);
    }
  },
};

// Export config để dùng trong booking/payment controller
export { LOYALTY_CONFIG };
export default loyaltyController;
