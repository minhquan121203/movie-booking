/**
 * @swagger
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Tạo đơn đặt vé
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduleId, seats]
 *             properties:
 *               scheduleId:
 *                 type: string
 *                 example: "6919ab92a5ca4e33ac76e928"
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                       example: "A1"
 *                     seatType:
 *                       type: string
 *                       example: "VIP"
 *                     price:
 *                       type: number
 *                       example: 120000
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "69198f14b80a32bf8ea5d920"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     size:
 *                       type: string
 *                       enum: [S, M, L, N/A]
 *                       example: "L"
 *               voucherCode:
 *                 type: string
 *                 example: "SUMMER2024"
 *     responses:
 *       201:
 *         description: Đặt vé thành công
 */

/**
 * @swagger
 * /bookings/my-bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy danh sách vé của tôi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách vé
 */

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Chi tiết đơn vé
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết vé
 */

/**
 * @swagger
 * /bookings/{id}/confirm-payment:
 *   post:
 *     tags: [Bookings]
 *     summary: Xác nhận thanh toán
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod: { type: string }
 *               transactionId: { type: string }
 *     responses:
 *       200:
 *         description: Xác nhận thành công
 */

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Hủy vé
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Hủy vé thành công
 */

/**
 * @swagger
 * /bookings/code/{bookingCode}:
 *   get:
 *     tags: [Bookings]
 *     summary: Lấy thông tin booking theo mã vé
 *     description: API công khai để tra cứu thông tin booking bằng mã vé (không cần authentication)
 *     parameters:
 *       - in: path
 *         name: bookingCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã booking (VD BK20251202S9GA61)
 *         example: "BK20251202S9GA61"
 *     responses:
 *       200:
 *         description: Thông tin booking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     bookingCode:
 *                       type: string
 *                       example: "BK20251202S9GA61"
 *                     customer:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         fullName: { type: string }
 *                         email: { type: string }
 *                         phoneNumber: { type: string }
 *                     schedule:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         showDate: { type: string, format: date-time }
 *                         showTime: { type: string }
 *                         movie:
 *                           type: object
 *                           properties:
 *                             title: { type: string }
 *                             posterUrl: { type: string }
 *                             duration: { type: number }
 *                         theater:
 *                           type: object
 *                           properties:
 *                             name: { type: string }
 *                             address: { type: string }
 *                         room:
 *                           type: object
 *                           properties:
 *                             name: { type: string }
 *                             roomType: { type: string }
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           seatNumber: { type: string }
 *                           seatType: { type: string }
 *                           price: { type: number }
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalAmount:
 *                       type: number
 *                       example: 120000
 *                     status:
 *                       type: string
 *                       example: "Hoàn tất"
 *                     qrCode:
 *                       type: string
 *                       description: Base64 QR code image
 *       404:
 *         description: Không tìm thấy booking
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /bookings/payos-status/{orderCode}:
 *   get:
 *     summary: Lấy trạng thái thanh toán PayOS
 *     tags: [Bookings]
 *     description: API dùng để liên tục kiểm tra (polling) xem khách hàng đã chuyển khoản thành công cho đơn hàng PayOS chưa.
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã đơn hàng (orderCode) do PayOS cấp
 *     responses:
 *       200:
 *         description: Trả về trạng thái đơn hàng (PAID hoặc PENDING, CANCELLED)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: PAID
 *                     message:
 *                       type: string
 *       400:
 *         description: Lỗi thiếu orderCode
 *       500:
 *         description: Lỗi server hoặc không kết nối được PayOS
 */

export default {};
