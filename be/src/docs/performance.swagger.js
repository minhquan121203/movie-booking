/**
 * @swagger
 * tags:
 *   name: Performance Metrics
 *   description: Tracking và đánh giá hiệu suất (KPI)
 */

/**
 * @swagger
 * /performance/theater/{theaterId}:
 *   post:
 *     tags: [Performance Metrics]
 *     summary: Track hiệu suất rạp
 *     description: Track performance metrics của rạp (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, period]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               period:
 *                 type: string
 *                 enum: [hourly, daily, weekly, monthly]
 *     responses:
 *       201:
 *         description: Tracking thành công
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/staff/{staffId}:
 *   post:
 *     tags: [Performance Metrics]
 *     summary: Track hiệu suất nhân viên
 *     description: Track performance metrics của nhân viên (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, period]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       201:
 *         description: Tracking thành công
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/movie/{movieId}:
 *   post:
 *     tags: [Performance Metrics]
 *     summary: Track hiệu suất phim
 *     description: Track performance metrics của phim (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, period]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       201:
 *         description: Tracking thành công
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/history/{entityType}/{entityId}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Lịch sử hiệu suất
 *     description: Lấy lịch sử performance metrics (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theater, staff, movie]
 *       - in: path
 *         name: entityId
 *         required: true
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Lịch sử hiệu suất
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/comparison/{entityType}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: So sánh hiệu suất
 *     description: So sánh performance giữa nhiều entities (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theater, staff, movie]
 *       - in: query
 *         name: entityIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated entity IDs
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Kết quả so sánh
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/kpi/staff/{staffId}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Lấy KPI nhân viên
 *     description: Lấy KPI metrics của nhân viên (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
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
 *     responses:
 *       200:
 *         description: KPI data
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/kpi/staff/{staffId}/calculate:
 *   post:
 *     tags: [Performance Metrics]
 *     summary: Tính KPI nhân viên
 *     description: Calculate KPI cho nhân viên (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: KPI calculated
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/kpi/theater/{theaterId}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Lấy KPI rạp
 *     description: Lấy KPI metrics của rạp (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: KPI data
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/kpi/movie/{movieId}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Lấy KPI phim
 *     description: Lấy KPI metrics của phim (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: KPI data
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/alerts/{entityType}/{entityId}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Performance alerts
 *     description: Lấy alerts về performance issues (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theater, staff, movie]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance alerts
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/trends/{entityType}/{entityId}:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Performance trends
 *     description: Phân tích trends của performance metrics (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theater, staff, movie]
 *       - in: path
 *         name: entityId
 *         required: true
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Trend analysis
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /performance/top-performers:
 *   get:
 *     tags: [Performance Metrics]
 *     summary: Top performers
 *     description: Lấy danh sách top performers (Admin/Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theater, staff, movie]
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top performers list
 *       401:
 *         description: Unauthorized
*/
export default {};
