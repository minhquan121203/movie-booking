/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff profile và operations
 */

/**
 * @swagger
 * /staff/profile:
 *   get:
 *     tags: [Staff]
 *     summary: Lấy profile nhân viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff profile
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags: [Staff]
 *     summary: Cập nhật profile nhân viên
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /staff/dashboard:
 *   get:
 *     tags: [Staff]
 *     summary: Lấy dashboard data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /staff/theater:
 *   get:
 *     tags: [Staff]
 *     summary: Lấy thông tin rạp được assign
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Theater info
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /staff/permissions/{permission}:
 *   get:
 *     tags: [Staff]
 *     summary: Kiểm tra permission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission check result
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /staff/bookings:
 *   post:
 *     tags: [Staff]
 *     summary: Tạo booking tại quầy (counter booking)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleId
 *               - seats
 *               - customerInfo
 *               - paymentMethod
 *             properties:
 *               scheduleId:
 *                 type: string
 *                 description: ID của suất chiếu
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [seatNumber]
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                     seatType:
 *                       type: string
 *                     price:
 *                       type: number
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
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
 *                   customerId:
 *                     type: string
 *                     description: "(Optional) existing customer id"
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, qr, mixed]
 *               cashReceived:
 *                 type: number
 *                 description: "Số tiền khách đưa (bắt buộc khi paymentMethod = cash)"
 *               voucherCode:
 *                 type: string
 *             example:
 *               scheduleId: "692d23d28c8bba7022f56043"
 *               seats:
 *                 - seatNumber: "A1"
 *                   seatType: "VIP"
 *                   price: 120000
 *               customerInfo:
 *                 fullName: "Dũng Nguyễn"
 *                 email: "anhdung2004hd123@gmail.com"
 *               paymentMethod: "cash"
 *               cashReceived: 150000
 *     responses:
 *       200:
 *         description: Booking and transaction created
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
 *                     booking:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         bookingCode:
 *                           type: string
 *                         status:
 *                           type: string
 *                         movieTitle:
 *                           type: string
 *                         theaterName:
 *                           type: string
 *                         showTime:
 *                           type: string
 *                         seats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               seatNumber:
 *                                 type: string
 *                               seatType:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                         totalAmount:
 *                           type: number
 *                         qrCode:
 *                           type: string
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         transactionId:
 *                           type: string
 *                         staffName:
 *                           type: string
 *                         theaterName:
 *                           type: string
 *                         customerName:
 *                           type: string
 *                         totalAmount:
 *                           type: number
 *                         cashReceived:
 *                           type: number
 *                         changeGiven:
 *                           type: number
 *                         status:
 *                           type: string
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               data:
 *                 booking:
 *                   _id: "64f1a2..."
 *                   bookingCode: "BK20251201001"
 *                   status: "Hoàn tất"
 *                   movieTitle: "Spider-Man"
 *                   theaterName: "CGV Tân Bình"
 *                   showTime: "18:00 - 20:00"
 *                   seats:
 *                     - seatNumber: "A1"
 *                       seatType: "VIP"
 *                       price: 120000
 *                   totalAmount: 120000
 *                   qrCode: "data:image/png;base64,..."
 *                 transaction:
 *                   _id: "64f2b3..."
 *                   transactionId: "CT20251201ABC123"
 *                   staffName: "Nhân viên Cinema"
 *                   theaterName: "CGV Tân Bình"
 *                   customerName: "Dũng Nguyễn"
 *                   totalAmount: 120000
 *                   cashReceived: 150000
 *                   changeGiven: 30000
 *                   status: "completed"
 *               message: "Booking thành công"
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /staff/bookings/my-transactions:
 *   get:
 *     tags: [Staff]
 *     summary: Lấy giao dịch của nhân viên
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
 *         description: Array of transactions
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /staff/bookings/theater-transactions:
 *   get:
 *     tags: [Staff]
 *     summary: Lấy giao dịch theo rạp (staff/manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Array of transactions for the theater
 *       401:
 *         description: Unauthorized
 */
export default {};
