/**
 * @swagger
 * tags:
 *   name: Staff Reports
 *   description: Daily reports management (Staff)
 */

/**
 * @swagger
 * /staff/reports/draft:
 *   get:
 *     tags: [Staff Reports]
 *     summary: Lấy draft report
 *     description: Lấy draft report của ngày hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Draft report
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/generate-data:
 *   get:
 *     tags: [Staff Reports]
 *     summary: Generate report data
 *     description: Tự động generate data cho report
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
 *         description: Generated report data
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/{id}:
 *   put:
 *     tags: [Staff Reports]
 *     summary: Cập nhật report
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
 *               summary:
 *                 type: string
 *               issues:
 *                 type: array
 *                 items:
 *                   type: object
 *               recommendations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report updated
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/{id}/submit:
 *   post:
 *     tags: [Staff Reports]
 *     summary: Submit report
 *     description: Submit report để manager review
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
 *         description: Report submitted
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/my-reports:
 *   get:
 *     tags: [Staff Reports]
 *     summary: Lấy reports của nhân viên
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected]
 *     responses:
 *       200:
 *         description: Report list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/theater:
 *   get:
 *     tags: [Staff Reports]
 *     summary: Lấy reports của rạp
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/{id}/review:
 *   post:
 *     tags: [Staff Reports]
 *     summary: Review report (Manager)
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review completed
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/reports/stats:
 *   get:
 *     tags: [Staff Reports]
 *     summary: Lấy report statistics
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
 *         description: Report statistics
 *       401:
 *         description: Unauthorized
*/
export default {};
