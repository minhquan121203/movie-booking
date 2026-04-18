/**
 * @swagger
 * /vouchers/verify:
 *   post:
 *     tags: [Vouchers]
 *     summary: Xác thực mã voucher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string, example: "SUMMER2024" }
 *     responses:
 *       200:
 *         description: Voucher hợp lệ
 */

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật voucher (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID voucher cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUMMER2024"
 *               description:
 *                 type: string
 *                 example: "Giảm giá mùa hè"
 *               discountType:
 *                 type: string
 *                 enum: [fixed, percent]
 *                 example: "percent"
 *               discountValue:
 *                 type: number
 *                 example: 20
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 50000
 *               minOrderValue:
 *                 type: number
 *                 example: 150000
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-31"
 *               usageLimit:
 *                 type: number
 *                 example: 100
 *               usageLimitPerUser:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật voucher thành công
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa voucher (Admin)
 *     description: Xóa vĩnh viễn voucher khỏi hệ thống.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID voucher cần xóa
 *     responses:
 *       200:
 *         description: Xóa voucher thành công
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi server
 */


/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách voucher (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by Business Status
 *     responses:
 *       200:
 *         description: Danh sách voucher
 */

export default {};
