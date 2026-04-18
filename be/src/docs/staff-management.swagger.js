/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Lấy danh sách tất cả nhân viên (có thể lọc theo rạp)
 *     tags: [Admin - Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *         description: "ID của rạp để lọc nhân viên tại rạp đó (tùy chọn)"
 *     responses:
 *       200:
 *         description: "Thành công"
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
 *                     staff:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           staffInfo:
 *                             type: object
 *                             properties:
 *                               staffId:
 *                                 type: string
 *                               position:
 *                                 type: string
 *                                 enum: [cashier, usher, supervisor, manager]
 *                               shift:
 *                                 type: string
 *                                 enum: [morning, afternoon, evening, night]
 *                               assignedTheater:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   address:
 *                                     type: string
 *                                   city:
 *                                     type: string
 *                     total:
 *                       type: number
 *                 message:
 *                   type: string
 *       401:
 *         description: "Không được phép"
 *       500:
 *         description: "Lỗi server"
 *
 * /admin/staff/assign-theater:
 *   post:
 *     summary: Gán rạp cho nhân viên
 *     tags: [Admin - Staff Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - theaterId
 *             properties:
 *               staffId:
 *                 type: string
 *                 description: "ID của nhân viên"
 *               theaterId:
 *                 type: string
 *                 description: "ID của rạp cần gán"
 *           example:
 *             staffId: "65a1234567890abcd1234567"
 *             theaterId: "65b1234567890abcd1234567"
 *     responses:
 *       200:
 *         description: "Gán rạp thành công"
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
 *                     staff:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         staffInfo:
 *                           type: object
 *                           properties:
 *                             assignedTheater:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 address:
 *                                   type: string
 *                                 city:
 *                                   type: string
 *                 message:
 *                   type: string
 *                   example: "Đã gán rạp \"CGV Tân Bình\" cho nhân viên \"Nguyễn Văn A\" thành công"
 *       400:
 *         description: "Thông tin không hợp lệ"
 *       404:
 *         description: "Nhân viên hoặc rạp không tồn tại"
 *       401:
 *         description: "Không được phép"
 *       500:
 *         description: "Lỗi server"
 *
 * /admin/staff/{staffId}/remove-theater:
 *   delete:
 *     summary: Hủy gán rạp cho nhân viên
 *     tags: [Admin - Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         schema:
 *           type: string
 *         required: true
 *         description: "ID của nhân viên"
 *     responses:
 *       200:
 *         description: "Hủy gán rạp thành công"
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
 *                     staff:
 *                       type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: "Nhân viên không tồn tại"
 *       401:
 *         description: "Không được phép"
 *       500:
 *         description: "Lỗi server"
 *
 * /admin/staff/theater/{theaterId}:
 *   get:
 *     summary: Lấy danh sách nhân viên tại một rạp cụ thể
 *     tags: [Admin - Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         schema:
 *           type: string
 *         required: true
 *         description: "ID của rạp"
 *     responses:
 *       200:
 *         description: "Thành công"
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
 *                     staff:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: number
 *                     theater:
 *                       type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: "Rạp không tồn tại"
 *       401:
 *         description: "Không được phép"
 *       500:
 *         description: "Lỗi server"
 */
