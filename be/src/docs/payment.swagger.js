/**
 * @swagger
 * /bookings/{bookingId}/payment/vnpay:
 *   post:
 *     tags: [Payment]
 *     summary: Tạo thanh toán VNPay
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: URL thanh toán VNPay
 */

/**
 * @swagger
 * /bookings/{bookingId}/payment/momo:
 *   post:
 *     tags: [Payment]
 *     summary: Tạo thanh toán MoMo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: URL thanh toán MoMo
 */

/**
 * @swagger
 * /payment/vnpay-return:
 *   get:
 *     tags: [Payment]
 *     summary: VNPay callback return
 *     responses:
 *       200:
 *         description: Xử lý callback
 */

/**
 * @swagger
 * /payment/momo-return:
 *   get:
 *     tags: [Payment]
 *     summary: MoMo callback return
 *     responses:
 *       200:
 *         description: Xử lý callback
 */

/**
 * @swagger
 * /bookings/{bookingId}/payment/status:
 *   get:
 *     tags: [Payment]
 *     summary: Kiểm tra trạng thái thanh toán
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trạng thái thanh toán
 */

/**
 * @swagger
 * /bookings/{bookingId}/payment/refund:
 *   post:
 *     tags: [Payment]
 *     summary: Hoàn tiền (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 */

/**
 * @swagger
 * /payment/vnpay-ipn:
 *   get:
 *     tags: [Payment]
 *     summary: VNPay IPN callback (Server-to-Server)
 *     description: VNPay gọi API này để thông báo kết quả giao dịch. Không yêu cầu authentication.
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema: { type: string }
 *         description: Mã đơn hàng (orderId)
 *       - in: query
 *         name: vnp_Amount
 *         schema: { type: number }
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_SecureHash
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: VNPay IPN đã được xử lý
 */

/**
 * @swagger
 * /payment/momo-notify:
 *   post:
 *     tags: [Payment]
 *     summary: MoMo Notify callback (Server-to-Server)
 *     description: MoMo gửi notify về server để xác nhận giao dịch. Không yêu cầu token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string }
 *               requestId: { type: string }
 *               amount: { type: number }
 *               resultCode: { type: number }
 *               message: { type: string }
 *               transId: { type: number }
 *               signature: { type: string }
 *     responses:
 *       200:
 *         description: MoMo Notify đã được xử lý
 */

/**
 * @swagger
 * /payment/vnpay-return:
 *   get:
 *     tags: [Payment]
 *     summary: VNPay Return URL (Client redirect)
 *     description: Cổng VNPay redirect user về URL này sau khi thanh toán.
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_Amount
 *         schema: { type: number }
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_SecureHash
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect về trang FE (success/failed)
 */

/**
 * @swagger
 * /payment/momo-return:
 *   get:
 *     tags: [Payment]
 *     summary: MoMo Return URL (Client redirect)
 *     description: MoMo redirect user về URL này sau khi thanh toán.
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema: { type: string }
 *       - in: query
 *         name: amount
 *         schema: { type: number }
 *       - in: query
 *         name: resultCode
 *         schema: { type: number }
 *       - in: query
 *         name: signature
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect về trang FE (success/failed)
 */

/**
 * @swagger
 * /payment/ipn/test:
 *   get:
 *     tags: [Payment]
 *     summary: Kiểm tra API IPN hoạt động (debug)
 *     description: Dùng cho môi trường test để kiểm tra server hoạt động.
 *     responses:
 *       200:
 *         description: IPN test OK
 */

/**
 * @swagger
 * /api/payment/payos-webhook:
 *   post:
 *     summary: PayOS Webhook (Server-to-Server)
 *     tags:
 *       - Payment
 *     description: API để PayOS tự động gọi về khi khách chuyển khoản thành công.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook nhận thành công
 */

export default {};
