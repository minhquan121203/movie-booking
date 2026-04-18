/**
 * MISSING SWAGGER DOCS - Các API còn thiếu trong Swagger
 * Thêm các docs này vào các file tương ứng
 */

// ============================================
// BOOKINGS - Thêm vào bookings.swagger.js
// ============================================

/**
 * @swagger
 * /bookings/{id}/regenerate-qr:
 *   post:
 *     tags: [Bookings]
 *     summary: Tạo lại QR code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tạo QR code thành công
 */

// ============================================
// SHIFTS - Thêm vào shift.swagger.js
// ============================================

/**
 * @swagger
 * /shifts/{shiftId}:
 *   delete:
 *     tags: [Shift Management]
 *     summary: Xóa ca làm việc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa ca thành công
 */

// ============================================
// ANALYTICS - Thêm vào analytics.swagger.js
// ============================================

/**
 * @swagger
 * /analytics/reports/{reportId}:
 *   delete:
 *     tags: [Analytics]
 *     summary: Xóa báo cáo phân tích
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa báo cáo thành công
 */

// ============================================
// QR SCANNER - Thêm vào qr-scanner.swagger.js
// ============================================

/**
 * @swagger
 * /qr-scanner/statistics/{theaterId}:
 *   get:
 *     tags: [QR Scanner]
 *     summary: Thống kê quét QR của rạp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Thống kê QR scanner
 */

/**
 * @swagger
 * /qr-scanner/test:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Test hệ thống QR scanner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test thành công
 */

// ============================================
// ADMIN REVIEWS - Thêm vào admin.swagger.js
// ============================================

/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa đánh giá (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

// ============================================
// ADMIN USERS - Thêm vào users.swagger.js
// ============================================

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật vai trò và quyền (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */


// ============================================
// ADMIN PRODUCTS - Thêm vào products.swagger.js
// ============================================

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật sản phẩm
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
 *               name: { type: string }
 *               price: { type: number }
 *               category: { type: string, enum: [Popcorn, Drink, Combo, Snack] }
 *               inStock: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa sản phẩm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

// ============================================
// ADMIN VOUCHERS - Thêm vào vouchers.swagger.js
// ============================================

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật voucher
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
 *               description: { type: string }
 *               usageLimit: { type: number }
 *               endDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa voucher
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

// ============================================
// ADMIN STATISTICS - Thêm vào admin.swagger.js
// ============================================

/**
 * @swagger
 * /admin/statistics/movies:
 *   get:
 *     tags: [Admin]
 *     summary: Thống kê phim
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Thống kê phim
 */

// ============================================
// ADMIN UPLOAD - Thêm vào upload.swagger.js
// ============================================

/**
 * @swagger
 * /admin/banners/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload banner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */

/**
 * @swagger
 * /admin/upload/multiple:
 *   post:
 *     tags: [Upload]
 *     summary: Upload nhiều ảnh
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */

/**
 * @swagger
 * /admin/upload/{publicId}:
 *   delete:
 *     tags: [Upload]
 *     summary: Xóa ảnh từ Cloudinary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string }
 *         description: Public ID của ảnh trên Cloudinary
 *     responses:
 *       200:
 *         description: Xóa ảnh thành công
 */

// ============================================
// PAYMENT - Thêm vào payment.swagger.js
// ============================================

/**
 * @swagger
 * /bookings/{bookingId}/payment/refund:
 *   post:
 *     tags: [Payment]
 *     summary: Hoàn tiền (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Hủy vé theo yêu cầu"
 *               amount:
 *                 type: number
 *                 example: 200000
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 */

export default {};
