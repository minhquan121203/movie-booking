/**
 * @swagger
 * tags:
 *   name: Customer Support
 *   description: Complaints và incidents management (Staff)
 */

/**
 * @swagger
 * /staff/complaints:
 *   post:
 *     tags: [Customer Support]
 *     summary: Tạo complaint
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, category, description]
 *             properties:
 *               customerId:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [service, facility, booking, payment, other]
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Complaint created
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags: [Customer Support]
 *     summary: Lấy danh sách complaints
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaint list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/complaints/{id}:
 *   get:
 *     tags: [Customer Support]
 *     summary: Lấy chi tiết complaint
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
 *         description: Complaint details
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/complaints/{id}/status:
 *   put:
 *     tags: [Customer Support]
 *     summary: Cập nhật status complaint
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
 *                 enum: [pending, in-progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/complaints/{id}/resolve:
 *   post:
 *     tags: [Customer Support]
 *     summary: Resolve complaint
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
 *             required: [resolution]
 *             properties:
 *               resolution:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complaint resolved
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/incidents:
 *   post:
 *     tags: [Customer Support]
 *     summary: Report incident
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, description, severity]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [technical, safety, security, customer-service, other]
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident reported
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags: [Customer Support]
 *     summary: Lấy danh sách incidents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incident list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/incidents/{id}:
 *   get:
 *     tags: [Customer Support]
 *     summary: Lấy chi tiết incident
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
 *         description: Incident details
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/incidents/{id}/acknowledge:
 *   post:
 *     tags: [Customer Support]
 *     summary: Acknowledge incident
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
 *         description: Incident acknowledged
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/incidents/{id}/resolve:
 *   post:
 *     tags: [Customer Support]
 *     summary: Resolve incident
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
 *             required: [resolution]
 *             properties:
 *               resolution:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident resolved
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/incidents/{id}/actions:
 *   post:
 *     tags: [Customer Support]
 *     summary: Add action to incident
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action added
 *       401:
 *         description: Unauthorized
*/
export default {};
