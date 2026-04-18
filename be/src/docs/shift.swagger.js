/**
 * @swagger
 * tags:
 *   name: Shift Management
 *   description: Quản lý ca làm việc và chuyên cần nhân viên
 */

/**
 * @swagger
 * /shifts:
 *   post:
 *     tags: [Shift Management]
 *     summary: Tạo ca làm việc mới
 *     description: Tạo ca làm việc cho nhân viên (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theater, staff, shiftType, date, startTime, endTime, position]
 *             properties:
 *               theater:
 *                 type: string
 *                 description: Theater ID
 *               staff:
 *                 type: string
 *                 description: Staff ID
 *               shiftType:
 *                 type: string
 *                 enum: [morning, afternoon, evening, night, full-day]
 *                 description: Loại ca làm việc
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Ngày làm việc (YYYY-MM-DD)
 *               startTime:
 *                 type: string
 *                 description: Giờ bắt đầu (HH:mm)
 *                 example: "08:00"
 *               endTime:
 *                 type: string
 *                 description: Giờ kết thúc (HH:mm)
 *                 example: "14:00"
 *               position:
 *                 type: string
 *                 enum: [cashier, usher, projectionist, manager, cleaner, security]
 *                 description: Vị trí công việc
 *               notes:
 *                 type: string
 *                 description: Ghi chú
 *     responses:
 *       201:
 *         description: Tạo ca làm việc thành công
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/Manager only)
 */

/**
 * @swagger
 * /shifts/{shiftId}/check-in:
 *   post:
 *     tags: [Shift Management]
 *     summary: Check-in ca làm việc
 *     description: Nhân viên check-in khi bắt đầu ca làm việc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude]
 *                     example: [106.6297, 10.8231]
 *               method:
 *                 type: string
 *                 enum: [manual, qr-code, biometric, mobile-app]
 *                 default: manual
 *     responses:
 *       200:
 *         description: Check-in thành công
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /shifts/{shiftId}/check-out:
 *   post:
 *     tags: [Shift Management]
 *     summary: Check-out ca làm việc
 *     description: Nhân viên check-out khi kết thúc ca làm việc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [106.6297, 10.8231]
 *               method:
 *                 type: string
 *                 enum: [manual, qr-code, biometric, mobile-app]
 *                 default: manual
 *               breakTime:
 *                 type: number
 *                 description: Thời gian nghỉ (hours)
 *                 example: 0.5
 *     responses:
 *       200:
 *         description: Check-out thành công
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /shifts/theater/{theaterId}:
 *   get:
 *     tags: [Shift Management]
 *     summary: Lấy ca làm việc theo rạp
 *     description: Lấy danh sách ca làm việc của một rạp theo khoảng thời gian
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, checked-in, completed, cancelled, no-show]
 *         description: Filter by status
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter active (non-cancelled) shifts
 *     responses:
 *       200:
 *         description: Danh sách ca làm việc
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /shifts/staff/{staffId}:
 *   get:
 *     tags: [Shift Management]
 *     summary: Lấy ca làm việc theo nhân viên
 *     description: Lấy danh sách ca làm việc của một nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, checked-in, completed, cancelled, no-show]
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter active (non-cancelled) shifts
 *     responses:
 *       200:
 *         description: Danh sách ca làm việc
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /shifts/{shiftId}/swap-request:
 *   post:
 *     tags: [Shift Management]
 *     summary: Yêu cầu đổi ca
 *     description: Nhân viên yêu cầu đổi ca làm việc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do đổi ca
 *                 example: "Có việc gia đình đột xuất"
 *     responses:
 *       200:
 *         description: Yêu cầu đổi ca thành công
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /shifts/{shiftId}/swap-approve:
 *   post:
 *     tags: [Shift Management]
 *     summary: Phê duyệt đổi ca
 *     description: Manager phê duyệt yêu cầu đổi ca (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newStaffId]
 *             properties:
 *               newStaffId:
 *                 type: string
 *                 description: ID nhân viên thay thế
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/Manager only)
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /shifts/attendance/{theaterId}:
 *   get:
 *     tags: [Shift Management]
 *     summary: Báo cáo chuyên cần
 *     description: Lấy báo cáo chuyên cần của nhân viên theo rạp (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *     responses:
 *       200:
 *         description: Báo cáo chuyên cần
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
 *                     totalShifts:
 *                       type: number
 *                     completedShifts:
 *                       type: number
 *                     lateCheckIns:
 *                       type: number
 *                     noShows:
 *                       type: number
 *                     attendanceRate:
 *                       type: number
 *                     punctualityRate:
 *                       type: number
 *                     staffDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /shifts/generate-schedule:
 *   post:
 *     tags: [Shift Management]
 *     summary: Tự động tạo lịch làm việc
 *     description: Tự động generate lịch làm việc cho nhân viên (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theaterId, startDate, endDate, staffList]
 *             properties:
 *               theaterId:
 *                 type: string
 *                 description: Theater ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date (YYYY-MM-DD)
 *               staffList:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     position:
 *                       type: string
 *                       enum: [cashier, usher, projectionist, manager, cleaner, security]
 *                 description: Danh sách nhân viên và vị trí
 *     responses:
 *       201:
 *         description: Tạo lịch thành công
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
 *                     totalShifts:
 *                       type: number
 *                     shifts:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /shifts/my-theater:
 *   get:
 *     tags: [Shift Management]
 *     summary: Lấy ca làm việc của rạp mà nhân viên đang thuộc về
 *     description: Lấy danh sách ca làm việc theo rạp của nhân viên đang đăng nhập
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
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter active (non-cancelled) shifts
 *     responses:
 *       200:
 *         description: Danh sách ca làm việc
 *       404:
 *         description: Nhân viên không thuộc rạp nào
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /shifts/flexible:
 *   get:
 *     tags: [Shift Management]
 *     summary: Lấy ca làm việc linh hoạt theo nhân viên hoặc rạp
 *     description: API linh hoạt cho phép lọc ca theo rạp, nhân viên hoặc toàn bộ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter active (non-cancelled) shifts
 *     responses:
 *       200:
 *         description: Danh sách ca làm việc
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /shifts/{shiftId}:
 *   put:
 *     tags: [Shift Management]
 *     summary: Cập nhật thông tin ca làm việc
 *     description: Admin/Manager cập nhật thông tin ca
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Các trường cần cập nhật
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Shift not found
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /shifts/{shiftId}:
 *   delete:
 *     tags: [Shift Management]
 *     summary: Hủy ca làm việc
 *     description: Đặt trạng thái ca làm việc thành 'cancelled'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hủy ca thành công
 *       404:
 *         description: Shift not found
 *       401:
 *         description: Unauthorized
 */




export default {};
