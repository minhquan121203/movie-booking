/**
 * @swagger
 * tags:
 *   name: QR Scanner
 *   description: QR code scanning và check-in management
 */

/**
 * @swagger
 * /qr-scanner/quick-validate:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Quick validate QR code (Real-time scanning)
 *     description: Validate nhanh QR code cho real-time scanning, không query database nặng
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
 *                 description: QR data string (format bookingId:timestamp:signature)
 *                 example: "65a1b2c3d4e5f6789012345:1704124800000:a1b2c3d4e5f6789012345678901234567890abcdef"
 *     responses:
 *       200:
 *         description: Validation result
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
 *                     valid:
 *                       type: boolean
 *                     bookingId:
 *                       type: string
 *                     bookingCode:
 *                       type: string
 *                     reason:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/validate:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Full validate QR code
 *     description: Validate đầy đủ QR code với tất cả checks (format, signature, expiry, booking status, show time)
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
 *                 description: QR data string
 *                 example: "65a1b2c3d4e5f6789012345:1704124800000:a1b2c3d4e5f6789012345678901234567890abcdef"
 *     responses:
 *       200:
 *         description: Full validation result
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
 *                     valid:
 *                       type: boolean
 *                     booking:
 *                       type: object
 *                       description: Booking details
 *                     showTime:
 *                       type: string
 *                       format: date-time
 *                     timeDiff:
 *                       type: number
 *                       description: Time difference in minutes
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid QR code
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/scan-check-in:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Check-in bằng QR scan
 *     description: Process check-in từ QR code scan, validate và tạo entry log
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrData, theaterId]
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: QR data string
 *                 example: "65a1b2c3d4e5f6789012345:1704124800000:a1b2c3d4e5f6789012345678901234567890abcdef"
 *               theaterId:
 *                 type: string
 *                 description: Theater ID where check-in happens
 *               deviceType:
 *                 type: string
 *                 description: Device type used for scanning
 *                 enum: [web-camera, mobile-camera, kiosk, handheld-scanner]
 *                 default: web-camera
 *     responses:
 *       200:
 *         description: Check-in successful
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
 *                     success:
 *                       type: boolean
 *                     booking:
 *                       type: object
 *                       properties:
 *                         bookingCode:
 *                           type: string
 *                         user:
 *                           type: object
 *                         seats:
 *                           type: array
 *                           items:
 *                             type: string
 *                         schedule:
 *                           type: object
 *                     entryLog:
 *                       type: object
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid QR or check-in failed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/check-in-by-code:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Check-in bằng booking code (Manual entry)
 *     description: Alternative check-in method using booking code instead of QR scan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingCode, theaterId]
 *             properties:
 *               bookingCode:
 *                 type: string
 *                 description: Booking code
 *                 example: "ABC123"
 *               theaterId:
 *                 type: string
 *                 description: Theater ID
 *               deviceType:
 *                 type: string
 *                 default: manual-entry
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Invalid booking code
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/bulk-check-in:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Bulk check-in cho group bookings
 *     description: Check-in nhiều bookings cùng lúc (group bookings)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingIds, theaterId]
 *             properties:
 *               bookingIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of booking IDs
 *                 example: ["id1", "id2", "id3"]
 *               theaterId:
 *                 type: string
 *                 description: Theater ID
 *               deviceType:
 *                 type: string
 *                 default: bulk-scanner
 *     responses:
 *       200:
 *         description: Bulk check-in result
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
 *                     total:
 *                       type: number
 *                     successful:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/generate/{bookingId}:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Generate QR code cho booking
 *     description: Tạo QR code với signature bảo mật cho booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: QR code generated
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
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                       example: "data:image/png;base64,..."
 *                     qrData:
 *                       type: string
 *                       description: QR data string
 *                     bookingId:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid booking
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */

/**
 * @swagger
 * /qr-scanner/verify-code:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Verify booking code
 *     description: Verify booking bằng code (không check-in, chỉ verify)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingCode, theaterId]
 *             properties:
 *               bookingCode:
 *                 type: string
 *                 description: Booking code to verify
 *                 example: "ABC123"
 *               theaterId:
 *                 type: string
 *                 description: Theater ID
 *     responses:
 *       200:
 *         description: Verification result
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
 *                     valid:
 *                       type: boolean
 *                     booking:
 *                       type: object
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid code
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/history/{theaterId}:
 *   get:
 *     tags: [QR Scanner]
 *     summary: Lấy scan history
 *     description: Lấy lịch sử scan/check-in theo theater với filters
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
 *         name: staff
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: entryMethod
 *         schema:
 *           type: string
 *           enum: [qr-scan, manual-code-entry, bulk-scanner]
 *         description: Filter by entry method
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Scan history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       booking:
 *                         type: object
 *                       user:
 *                         type: object
 *                       staff:
 *                         type: object
 *                       entryTime:
 *                         type: string
 *                         format: date-time
 *                       entryMethod:
 *                         type: string
 *                       verified:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /qr-scanner/statistics/{theaterId}:
 *   get:
 *     tags: [QR Scanner]
 *     summary: Lấy scan statistics
 *     description: Thống kê scan/check-in theo theater (total, success/failed, by method, by hour, by staff)
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
 *     responses:
 *       200:
 *         description: Statistics data
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
 *                     totalScans:
 *                       type: number
 *                     successfulScans:
 *                       type: number
 *                     failedScans:
 *                       type: number
 *                     byMethod:
 *                       type: object
 *                       properties:
 *                         qr-scan:
 *                           type: number
 *                         manual-code-entry:
 *                           type: number
 *                     byHour:
 *                       type: object
 *                       description: Scans by hour (0-23)
 *                     byStaff:
 *                       type: object
 *                       description: Scans by staff member
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /qr-scanner/init-camera:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Initialize camera stream
 *     description: Initialize camera cho scanning, trả về settings và endpoints
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theaterId]
 *             properties:
 *               theaterId:
 *                 type: string
 *                 description: Theater ID
 *     responses:
 *       200:
 *         description: Camera initialized
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
 *                     theaterId:
 *                       type: string
 *                     staffId:
 *                       type: string
 *                     streamId:
 *                       type: string
 *                     settings:
 *                       type: object
 *                       properties:
 *                         resolution:
 *                           type: object
 *                           properties:
 *                             width:
 *                               type: number
 *                             height:
 *                               type: number
 *                         frameRate:
 *                           type: number
 *                         facingMode:
 *                           type: string
 *                         scanInterval:
 *                           type: number
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         validate:
 *                           type: string
 *                         checkIn:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /qr-scanner/test:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Test QR scanner system
 *     description: Generate QR code và test validation (for testing purposes)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: Booking ID to test
 *     responses:
 *       200:
 *         description: Test result
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
 *                     qrCode:
 *                       type: object
 *                     validation:
 *                       type: object
 *                     testPassed:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */

export default {};
