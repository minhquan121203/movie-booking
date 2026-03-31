/**
 * @swagger
 * tags:
 *   - name: ShiftTemplates
 *     description: Quản lý cấu hình ca làm việc (shift template)
 *   - name: WorkSchedules
 *     description: Lập kế hoạch lịch làm việc
 *   - name: ShiftAssignments
 *     description: Phân công nhân sự và chấm công
 */

/* ============================================================
   SHIFT TEMPLATES
   ============================================================ */

/**
 * @swagger
 * /shift-templates:
 *   get:
 *     tags: [ShiftTemplates]
 *     summary: Lấy danh sách ca mẫu
 *     description: Lấy tất cả ca mẫu, có thể lọc theo trạng thái hoạt động (active=true/false).
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Lọc ca mẫu đang hoạt động hay không
 *     responses:
 *       200:
 *         description: Danh sách ca mẫu
 *   post:
 *     tags: [ShiftTemplates]
 *     summary: Tạo ca mẫu mới
 *     description: Chỉ admin/super-admin có quyền tạo ca mẫu.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, startTime, endTime]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "S1"
 *               name:
 *                 type: string
 *                 example: "Ca sáng"
 *               startTime:
 *                 type: string
 *                 example: "08:00"
 *               endTime:
 *                 type: string
 *                 example: "16:00"
 *     responses:
 *       201:
 *         description: Tạo ca mẫu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /shift-templates/{id}:
 *   get:
 *     tags: [ShiftTemplates]
 *     summary: Lấy thông tin ca mẫu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin ca mẫu
 *       404:
 *         description: Không tìm thấy ca mẫu
 *
 *   put:
 *     tags: [ShiftTemplates]
 *     summary: Cập nhật ca mẫu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy ca mẫu
 *
 *   delete:
 *     tags: [ShiftTemplates]
 *     summary: Vô hiệu hóa (soft-delete) ca mẫu
 *     description: isActive sẽ bị chuyển thành false
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã vô hiệu hóa ca mẫu
 *       404:
 *         description: Không tìm thấy ca mẫu
 */

/* ============================================================
   WORK SCHEDULES
   ============================================================ */

/**
 * @swagger
 * /work-schedules/generate:
 *   post:
 *     tags: [WorkSchedules]
 *     summary: Sinh lịch làm việc cho rạp theo dải ngày
 *     description: Tạo lịch làm việc dựa trên danh sách ca mẫu trong khoảng thời gian chỉ định.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theaterId, range, templateIds]
 *             properties:
 *               theaterId:
 *                 type: string
 *               range:
 *                 type: object
 *                 required: [from, to]
 *                 properties:
 *                   from:
 *                     type: string
 *                     example: "2025-12-01"
 *                   to:
 *                     type: string
 *                     example: "2025-12-07"
 *               templateIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               skipExisting:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Sinh lịch thành công
 *       400:
 *         description: Payload không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /work-schedules:
 *   get:
 *     tags: [WorkSchedules]
 *     summary: Lấy danh sách lịch làm việc
 *     description: Lọc theo rạp hoặc theo khoảng thời gian.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status
 *     responses:
 *       200:
 *         description: Danh sách lịch làm việc
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /work-schedules/daily-roster:
 *   get:
 *     tags: [WorkSchedules]
 *     summary: Lấy danh sách phân công nhân sự theo từng ca trong một ngày
 *     description: Trả về tất cả ca làm việc và nhân viên được phân công trong ngày, có thể lọc theo ca
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của rạp chiếu phim
 *         example: "69198f14b80a32bf8ea5d91c"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xem (YYYY-MM-DD)
 *         example: "2025-12-04"
 *       - in: query
 *         name: shiftCode
 *         required: false
 *         schema:
 *           type: string
 *         description: Mã ca để lọc (S1, S2, ...)
 *         example: "S1"
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter active (non-cancelled) work schedules
 *     responses:
 *       200:
 *         description: Thành công
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
 *                     date:
 *                       type: string
 *                       example: "2025-12-04"
 *                     shifts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           scheduleId:
 *                             type: string
 *                           date:
 *                             type: string
 *                           shift:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               code:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               startTime:
 *                                 type: string
 *                               endTime:
 *                                 type: string
 *                               color:
 *                                 type: string
 *                           startDateTime:
 *                             type: string
 *                             format: date-time
 *                           endDateTime:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [open, closed, cancelled]
 *                           employees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 assignmentId:
 *                                   type: string
 *                                 userId:
 *                                   type: string
 *                                 fullName:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                                 phoneNumber:
 *                                   type: string
 *                                 avatar:
 *                                   type: string
 *                                 role:
 *                                   type: string
 *                                 status:
 *                                   type: string
 *                                   enum: [pending, active, completed, no_show]
 *                                 checkInTime:
 *                                   type: string
 *                                   format: date-time
 *                                 checkOutTime:
 *                                   type: string
 *                                   format: date-time
 *                           totalEmployees:
 *                             type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSchedules:
 *                           type: integer
 *                         totalAssignments:
 *                           type: integer
 *                         activeNow:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         noShow:
 *                           type: integer
 *       400:
 *         description: Thiếu tham số bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /work-schedules/{workScheduleId}:
 *   delete:
 *     tags: [WorkSchedules]
 *     summary: Xóa lịch làm việc
 *     description: Xóa lịch làm việc theo ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workScheduleId
 *         required: true
 *         description: ID của lịch làm việc cần xóa.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa lịch làm việc và các phân công chờ liên quan.
 *       400:
 *         description: Không thể xóa vì đã có nhân viên check-in hoặc ca đã hoàn thành.
 *       404:
 *         description: Không tìm thấy lịch làm việc.
 *       500:
 *         description: Lỗi server.
 */

/**
 * @swagger
 * /theaters/{theaterId}/roster:
 *   get:
 *     tags: [WorkSchedules]
 *     summary: Lấy bảng phân ca (roster) theo ngày
 *     description: Trả về danh sách ca theo từng ngày của rạp.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu roster
 *       400:
 *         description: Thiếu tham số from/to
 *       500:
 *         description: Lỗi server
 */

/* ============================================================
   SHIFT ASSIGNMENTS
   ============================================================ */

/**
 * @swagger
 * /assignments/bulk:
 *   post:
 *     tags: [ShiftAssignments]
 *     summary: Phân công nhân sự hàng loạt
 *     description: Gán nhân viên vào nhiều lịch cùng lúc. Kiểm tra trùng ca, trùng rạp và trạng thái ca.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theaterId, assignments]
 *             properties:
 *               theaterId:
 *                 type: string
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [workScheduleId, userId, role]
 *                   properties:
 *                     workScheduleId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     role:
 *                       type: string
 *     responses:
 *       200:
 *         description: Kết quả phân công
 *       400:
 *         description: Payload không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /assignments/{id}:
 *   delete:
 *     tags: [ShiftAssignments]
 *     summary: Hủy phân công (Xóa nhân viên khỏi ca)
 *     description: Chỉ có thể hủy các phân công ở trạng thái 'pending' hoặc 'no_show'. Không thể hủy nếu nhân viên đã check-in.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của assignment cần hủy
 *     responses:
 *       200:
 *         description: Hủy thành công
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
 *                   example: "Đã hủy phân công thành công"
 *       400:
 *         description: Lỗi logic (Ví dụ nhân viên đã check-in rồi nên không cho xóa)
 *       404:
 *         description: Không tìm thấy assignment
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /schedules/{scheduleId}/assignments:
 *   get:
 *     tags: [ShiftAssignments]
 *     summary: Lấy danh sách phân công theo lịch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status
 *     responses:
 *       200:
 *         description: Danh sách phân công của lịch
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /assignments/of-user/{userId}:
 *   get:
 *     tags: [ShiftAssignments]
 *     summary: Lấy danh sách ca làm của một nhân viên (có phân trang + lọc ngày)
 *     description:
 *       Trả về danh sách các ca làm được phân cho một nhân viên, bao gồm thông tin lịch làm, rạp, và template ca.
 *       Hỗ trợ lọc theo ngày hoặc theo khoảng thời gian, đồng thời có phân trang.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nhân viên
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
 *         description: Số lượng item mỗi trang
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2025-01-10"
 *         description: Lọc theo ngày (YYYY-MM-DD)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           example: "2025-01-01"
 *         description: Ngày bắt đầu (dùng khi lọc khoảng)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           example: "2025-01-31"
 *         description: Ngày kết thúc (dùng khi lọc khoảng)
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter active assignments
 *     responses:
 *       200:
 *         description: Lấy danh sách ca làm thành công
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
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                           checkInTime:
 *                             type: string
 *                           checkOutTime:
 *                             type: string
 *                           assignedAt:
 *                             type: string
 *                           date:
 *                             type: string
 *                             example: "2025-01-10"
 *                           startDateTime:
 *                             type: string
 *                           endDateTime:
 *                             type: string
 *                           theaterName:
 *                             type: string
 *                           shiftName:
 *                             type: string
 *                           shiftCode:
 *                             type: string
 *                           startTime:
 *                             type: string
 *                           endTime:
 *                             type: string
 *                           color:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách ca làm thành công"
 *       404:
 *         description: Không tìm thấy ca làm của nhân viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /assignments/check-in:
 *   post:
 *     tags: [ShiftAssignments]
 *     summary: Nhân viên check-in ca làm
 *     description: Nếu không truyền workScheduleId, hệ thống sẽ tự tìm ca trong phạm vi ±30 phút.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workScheduleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in thành công
 *       404:
 *         description: Không có ca phù hợp
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /assignments/check-out:
 *   post:
 *     tags: [ShiftAssignments]
 *     summary: Nhân viên check-out ca làm
 *     description: Nếu không truyền workScheduleId, hệ thống tự chọn ca đang active gần nhất.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workScheduleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out thành công
 *       404:
 *         description: Không tìm thấy ca đang active
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /assignments/force-checkout:
 * post:
 * tags: [ShiftAssignments]
 * summary: Quản lý ép đóng ca thủ công
 * description: Dành cho Admin/Manager ép đóng ca khi nhân viên quên Check-out.
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - assignmentId
 * properties:
 * assignmentId:
 * type: string
 * description: ID của phân công ca làm việc cần ép đóng
 * manualCheckOutTime:
 * type: string
 * format: date-time
 * description: (Tùy chọn) Thời gian Check-out. Bỏ trống sẽ lấy giờ kết thúc ca.
 * managerNote:
 * type: string
 * description: (Tùy chọn) Ghi chú của quản lý
 * responses:
 * 200:
 * description: Đã ép đóng ca thành công
 * 400:
 * description: Ca không ở trạng thái Đang làm
 * 404:
 * description: Không tìm thấy ca làm việc
 */

export default {};
