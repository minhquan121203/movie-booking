/**
 * @swagger
 * tags:
 *   name: Counter Booking
 *   description: Đặt vé tại quầy (Staff)
 */

/**
 * @swagger
 * /staff/bookings:
 *   post:
 *     tags: [Counter Booking]
 *     summary: Tạo booking tại quầy
 *     description: Nhân viên tạo booking cho khách hàng tại quầy
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduleId, seats, customerInfo]
 *             properties:
 *               scheduleId:
 *                 type: string
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                     seatType:
 *                       type: string
 *                     price:
 *                       type: number
 *               customerInfo:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *               voucherCode:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, momo, vnpay, bank_transfer]
 *     responses:
 *       201:
 *         description: Booking created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
*/

/**
 * @swagger
 * /staff/concession:
 *   post:
 *     tags: [Counter Booking]
 *     summary: Tạo đơn hàng bắp nước (Concession)
 *     description: Nhân viên tạo đơn hàng bắp nước cho khách tại quầy (không kèm vé)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products]
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     size:
 *                       type: string
 *               customerInfo:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               voucherCode:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, qr, mixed, bank_transfer, MoMo, VNPAY]
 *     responses:
 *       201:
 *         description: Transaction created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /staff/bookings/my-transactions:
 *   get:
 *     tags: [Counter Booking]
 *     summary: Lấy transactions của nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transaction list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/bookings/theater-transactions:
 *   get:
 *     tags: [Counter Booking]
 *     summary: Lấy transactions của rạp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transaction list
 *       401:
 *         description: Unauthorized
*/

export default {};
