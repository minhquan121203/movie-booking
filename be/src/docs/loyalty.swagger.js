/**
 * @swagger
 * /loyalty/config:
 *   get:
 *     tags: [Loyalty]
 *     summary: Lấy cấu hình hệ thống tích điểm
 *     description: |
 *       Trả về toàn bộ config tích điểm: tỉ lệ tích/đổi theo hạng, ngưỡng nâng hạng, giới hạn đổi điểm.
 *       Không cần đăng nhập.
 *     responses:
 *       200:
 *         description: Config tích điểm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     earnRate:
 *                       type: object
 *                       properties:
 *                         Bạc: { type: number, example: 10000 }
 *                         Vàng: { type: number, example: 8000 }
 *                         Kim Cương: { type: number, example: 5000 }
 *                     redeemRate:
 *                       type: object
 *                       properties:
 *                         Bạc: { type: number, example: 500 }
 *                         Vàng: { type: number, example: 600 }
 *                         Kim Cương: { type: number, example: 800 }
 *                     maxRedeemPercent:
 *                       type: number
 *                       example: 50
 *                     minRedeemPoints:
 *                       type: number
 *                       example: 10
 *                     levelThresholds:
 *                       type: object
 *                       properties:
 *                         Vàng: { type: number, example: 500 }
 *                         Kim Cương: { type: number, example: 1125 }
 *                     levels:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string, example: "Bạc" }
 *                           icon: { type: string, example: "🥈" }
 *                           threshold: { type: number, example: 0 }
 *                           color: { type: string, example: "#C0C0C0" }
 */

/**
 * @swagger
 * /loyalty/me:
 *   get:
 *     tags: [Loyalty]
 *     summary: Xem điểm tích lũy và hạng thành viên
 *     description: |
 *       Trả về thông tin điểm hiện tại, hạng thành viên, tỉ lệ tích/đổi theo hạng,
 *       tiến trình nâng hạng, và thống kê giao dịch tổng hợp.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin loyalty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     points:
 *                       type: number
 *                       example: 350
 *                       description: Số điểm hiện tại
 *                     level:
 *                       type: string
 *                       example: "Bạc"
 *                       description: Hạng thành viên
 *                     earnRate:
 *                       type: number
 *                       example: 10000
 *                       description: Bao nhiêu VNĐ = 1 điểm
 *                     redeemRate:
 *                       type: number
 *                       example: 500
 *                       description: 1 điểm = bao nhiêu VNĐ
 *                     maxRedeemPercent:
 *                       type: number
 *                       example: 50
 *                     minRedeemPoints:
 *                       type: number
 *                       example: 10
 *                     nextLevel:
 *                       type: string
 *                       example: "Vàng"
 *                       nullable: true
 *                     pointsToNextLevel:
 *                       type: number
 *                       example: 150
 *                     progress:
 *                       type: number
 *                       example: 70
 *                       description: Phần trăm tiến trình nâng hạng
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalEarned: { type: number, example: 400 }
 *                         totalRedeemed: { type: number, example: 50 }
 *                         totalRefunded: { type: number, example: 0 }
 *                         totalBonus: { type: number, example: 0 }
 *                         transactionCount: { type: number, example: 12 }
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /loyalty/history:
 *   get:
 *     tags: [Loyalty]
 *     summary: Lịch sử giao dịch điểm
 *     description: |
 *       Trả về danh sách giao dịch điểm (tích, đổi, hoàn) có phân trang.
 *       Hỗ trợ lọc theo loại giao dịch.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số giao dịch mỗi trang (tối đa 50)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [earn, redeem, refund, bonus, expire]
 *         description: Lọc theo loại giao dịch
 *     responses:
 *       200:
 *         description: Danh sách giao dịch điểm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           type:
 *                             type: string
 *                             enum: [earn, redeem, refund, bonus, expire]
 *                             example: "earn"
 *                           points:
 *                             type: number
 *                             example: 15
 *                             description: Số điểm (+ khi earn, - khi redeem)
 *                           balance:
 *                             type: number
 *                             example: 350
 *                             description: Số dư sau giao dịch
 *                           description:
 *                             type: string
 *                             example: "Tích điểm từ vé BK20260516ABC - Avengers"
 *                           relatedBooking:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               bookingCode: { type: string, example: "BK20260516ABC" }
 *                               movieTitle: { type: string, example: "Avengers" }
 *                               totalAmount: { type: number, example: 150000 }
 *                           createdAt: { type: string, format: date-time }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer, example: 1 }
 *                         totalPages: { type: integer, example: 3 }
 *                         totalItems: { type: integer, example: 45 }
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /loyalty/preview:
 *   post:
 *     tags: [Loyalty]
 *     summary: Preview đổi điểm lấy giảm giá
 *     description: |
 *       Tính toán trước: dùng X điểm sẽ giảm bao nhiêu tiền.
 *       Tự động giới hạn tối đa 50% subtotal và tối thiểu 10 điểm.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pointsToUse
 *             properties:
 *               pointsToUse:
 *                 type: number
 *                 example: 50
 *                 description: Số điểm muốn dùng
 *               subtotal:
 *                 type: number
 *                 example: 200000
 *                 description: Tổng tiền đơn hàng (để tính giới hạn 50%)
 *     responses:
 *       200:
 *         description: Kết quả preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     pointsToUse:
 *                       type: number
 *                       example: 50
 *                     discount:
 *                       type: number
 *                       example: 25000
 *                       description: Số tiền được giảm (VNĐ)
 *                     redeemRate:
 *                       type: number
 *                       example: 500
 *                     remainingPoints:
 *                       type: number
 *                       example: 300
 *                     note:
 *                       type: string
 *                       nullable: true
 *                       description: Ghi chú nếu bị giới hạn
 *       400:
 *         description: Không đủ điểm hoặc dưới mức tối thiểu
 *       401:
 *         description: Chưa đăng nhập
 */

export default {};
