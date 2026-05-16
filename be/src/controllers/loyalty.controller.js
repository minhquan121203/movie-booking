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
    "Vàng": 1000,
    "Kim Cương": 5000,
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

      // Tính điểm cần để nâng hạng tiếp theo
      let nextLevel = null;
      let pointsToNextLevel = 0;
      if (level === "Bạc") {
        nextLevel = "Vàng";
        pointsToNextLevel = Math.max(0, LOYALTY_CONFIG.levelThresholds["Vàng"] - points);
      } else if (level === "Vàng") {
        nextLevel = "Kim Cương";
        pointsToNextLevel = Math.max(0, LOYALTY_CONFIG.levelThresholds["Kim Cương"] - points);
      }

      // Lấy thống kê
      const stats = await PointTransaction.getUserStats(req.userId);

      return successResponse(res, {
        points,
        level,
        earnRate: LOYALTY_CONFIG.earnRate[level],
        redeemRate: LOYALTY_CONFIG.redeemRate[level],
        maxRedeemPercent: LOYALTY_CONFIG.maxRedeemPercent,
        minRedeemPoints: LOYALTY_CONFIG.minRedeemPoints,
        nextLevel,
        pointsToNextLevel,
        progress: nextLevel
          ? Math.min(100, Math.round((points / LOYALTY_CONFIG.levelThresholds[nextLevel]) * 100))
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
          { name: "Vàng", icon: "🥇", threshold: 1000, color: "#FFD700" },
          { name: "Kim Cương", icon: "💎", threshold: 5000, color: "#B9F2FF" },
        ],
      });
    } catch (error) {
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

// Export config để dùng trong booking/payment controller
export { LOYALTY_CONFIG };
export default loyaltyController;
