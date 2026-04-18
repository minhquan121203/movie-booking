/**
 * @swagger
 * tags:
 *   name: Ticket Validation
 *   description: Validate và check-in vé (Staff)
 */

/**
 * @swagger
 * /staff/tickets/validate-code:
 *   post:
 *     tags: [Ticket Validation]
 *     summary: Validate vé bằng booking code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingCode]
 *             properties:
 *               bookingCode:
 *                 type: string
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: Validation result
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/tickets/validate-qr:
 *   post:
 *     tags: [Ticket Validation]
 *     summary: Validate vé bằng QR code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrData]
 *             properties:
 *               qrData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/tickets/my-validations:
 *   get:
 *     tags: [Ticket Validation]
 *     summary: Lấy validations của nhân viên
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
 *         description: Validation list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/tickets/theater-entries:
 *   get:
 *     tags: [Ticket Validation]
 *     summary: Lấy entries của rạp
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
 *         description: Entry list
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /staff/tickets/check/{bookingCode}:
 *   get:
 *     tags: [Ticket Validation]
 *     summary: Kiểm tra trạng thái vé
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket status
 *       401:
 *         description: Unauthorized
*/
export default {};
