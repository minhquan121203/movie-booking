/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Phân tích và báo cáo dữ liệu kinh doanh
 */

/**
 * @swagger
 * /analytics/reports:
 *   post:
 *     tags: [Analytics]
 *     summary: Tạo báo cáo phân tích
 *     description: Generate báo cáo phân tích theo loại và khoảng thời gian (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportType, category, startDate, endDate]
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly, yearly, custom]
 *               category:
 *                 type: string
 *                 enum: [revenue, attendance, staff-performance, movie-performance, theater-performance, customer-satisfaction]
 *               theater:
 *                 type: string
 *                 description: Theater ID (optional)
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Báo cáo được tạo thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Analytics]
 *     summary: Lấy danh sách báo cáo
 *     description: Lấy danh sách các báo cáo đã tạo (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách báo cáo
 */

/**
 * @swagger
 * /analytics/reports/{reportId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Lấy chi tiết báo cáo
 *     description: Lấy chi tiết một báo cáo cụ thể (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết báo cáo
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
*/

/**
 * @swagger
 * /analytics/dashboard/{theaterId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Dashboard metrics
 *     description: Lấy metrics cho dashboard theo period (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: today
 *     responses:
 *       200:
 *         description: Dashboard metrics
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /analytics/revenue:
 *   get:
 *     tags: [Analytics]
 *     summary: Phân tích doanh thu
 *     description: Phân tích doanh thu theo khoảng thời gian (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu doanh thu
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /analytics/attendance:
 *   get:
 *     tags: [Analytics]
 *     summary: Phân tích lượng khách
 *     description: Phân tích attendance theo thời gian (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu attendance
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /analytics/movies:
 *   get:
 *     tags: [Analytics]
 *     summary: Hiệu suất phim
 *     description: Phân tích hiệu suất các phim (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu hiệu suất phim
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /analytics/staff:
 *   get:
 *     tags: [Analytics]
 *     summary: Hiệu suất nhân viên
 *     description: Phân tích hiệu suất nhân viên (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu hiệu suất nhân viên
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /analytics/theaters:
 *   get:
 *     tags: [Analytics]
 *     summary: Hiệu suất rạp
 *     description: Phân tích hiệu suất các rạp (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dữ liệu hiệu suất rạp
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /analytics/satisfaction:
 *   get:
 *     tags: [Analytics]
 *     summary: Đánh giá khách hàng
 *     description: Phân tích customer satisfaction (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu customer satisfaction
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /dashboard/product-sales:
 *   get:
 *     tags: [Dashboard]
 *     summary: Thống kê sản phẩm bán được
 *     description: Thống kê số lượng sản phẩm đã bán từ vé và quầy (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           default: 2025
 *         description: Năm thống kê (default 2025)
 *       - in: query
 *         name: theater
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thống kê sản phẩm theo tháng
 *       401:
 *         description: Unauthorized
 */

export default {};
