/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard
 */

/**
 * @swagger
 * /admin/dashboard/sumary-overview:
 *   get:
 *     summary: Lấy tổng quan Dashboard tháng hiện tại
 *     description: Endpoint trả về số liệu tổng hợp của hệ thống trong tháng hiện tại
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công – trả về dữ liệu các card thống kê.
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
 *                     cards:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Tổng số tài khoản"
 *                           value:
 *                             type: number
 *                             example: 1200
 *                           subLabel:
 *                             type: string
 *                             example: "+45 tài khoản mới"
 *                           description:
 *                             type: string
 *                             example: "so với tháng trước"
 *
 *       401:
 *         description: Unauthorized – Token không hợp lệ hoặc không tồn tại.
 *
 *       403:
 *         description: Forbidden – Không có quyền truy cập.
 *
 *       500:
 *         description: Lỗi server.
 */



/**
 * @swagger
 * /admin/dashboard/top-movies:
 *   get:
 *     summary: Lấy Top 5 phim xem nhiều nhất
 *     description: Trả về danh sách 5 phim có lượt xem cao nhất, hỗ trợ lọc theo năm.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần lọc (mặc định là năm hiện tại)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Top 5 Phim Xem Nhiều Nhất"
 *                     subTitle:
 *                       type: string
 *                       example: "Xếp hạng theo lượt xem"
 *                     year:
 *                       type: number
 *                       example: 2024
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Avengers: Endgame"
 *                           value:
 *                             type: number
 *                             example: 1500
 */

/**
 * @swagger
 * /admin/dashboard/top-cinemas:
 *   get:
 *     summary: Lấy Top 5 rạp doanh thu cao nhất
 *     description: Trả về danh sách 5 rạp có doanh thu cao nhất, hỗ trợ lọc theo năm.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần lọc (mặc định là năm hiện tại)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Top 5 Rạp Doanh Thu Cao Nhất"
 *                     subTitle:
 *                       type: string
 *                       example: "Đơn vị: Triệu VND"
 *                     year:
 *                       type: number
 *                       example: 2024
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "CGV Vincom"
 *                           value:
 *                             type: number
 *                             example: 12500.5
 */


/**
 * @swagger
 * /admin/dashboard/top-employees:
 *   get:
 *     summary: Lấy Top 3 nhân viên xuất sắc
 *     description: Trả về 3 nhân viên có doanh thu cao nhất (từ CounterTransaction), filter theo năm.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần lọc (mặc định là năm hiện tại)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     subTitle:
 *                       type: string
 *                     year:
 *                       type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           value:
 *                             type: number
 */

/**
 * @swagger
 * /admin/dashboard/top-performance-movies:
 *   get:
 *     summary: Lấy Top 3 phim hiệu suất cao
 *     description: Trả về 3 phim có đánh giá trung bình cao nhất, filter theo năm.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần lọc
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     subTitle:
 *                       type: string
 *                     year:
 *                       type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           value:
 *                             type: number
 */

/**
 * @swagger
 * /admin/dashboard/top-effective-cinemas:
 *   get:
 *     summary: Lấy Top 3 rạp hoạt động hiệu quả
 *     description: Trả về 3 rạp có tỷ lệ lấp đầy cao nhất, filter theo năm.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần lọc
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     subTitle:
 *                       type: string
 *                     year:
 *                       type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           value:
 *                             type: number
 */


/**
 * @swagger
 * /admin/employee/kpi:
 *   get:
 *     summary: Lấy dữ liệu KPI nhân viên
 *     description: Trả về KPI của nhân viên theo tháng/năm.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nhân viên
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Tháng (mặc định tháng hiện tại)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm (mặc định năm hiện tại)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                       properties:
 *                         overallScore:
 *                           type: number
 *                         performanceLevel:
 *                           type: string
 */



/**
 * @swagger
 * /admin/performance/trend:
 *   get:
 *     summary: Lấy xu hướng hiệu suất 
 *     description: Trả về xu hướng điểm đánh giá nhân viên và tỷ lệ lấp đầy rạp theo 12 tháng.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần xem (mặc định năm hiện tại)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     subTitle:
 *                       type: string
 *                     year:
 *                       type: number
 *                     months:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tenThang:
 *                             type: string
 *                           values:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 value:
 *                                   type: number
 */

/**
 * @swagger
 * /admin/revenue-views:
 *   get:
 *     summary: Lấy doanh thu và lượt xem
 *     description: Trả về tổng doanh thu và lượt xem theo 12 tháng.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần xem (mặc định năm hiện tại)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     subTitle:
 *                       type: string
 *                     year:
 *                       type: number
 *                     months:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tenThang:
 *                             type: string
 *                           values:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 value:
 *                                   type: number
 */

/**
 * @swagger
 * /admin/performance/compare:
 *   get:
 *     summary: So sánh hiệu suất nhân viên
 *     description: Trả về dữ liệu so sánh (radar chart/column chart) giữa nhiều nhân viên.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách ID nhân viên, cách nhau bởi dấu phẩy
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Tháng
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     comparison:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           staffId:
 *                             type: string
 *                           staffName:
 *                             type: string
 *                           stats:
 *                             type: object
 *                             properties:
 *                               Sales:
 *                                 type: number
 *                               Service:
 *                                 type: number
 *                               Operations:
 *                                 type: number
 *                               Attendance:
 *                                 type: number
 *                               Quality:
 *                                 type: number
 */

export default {};