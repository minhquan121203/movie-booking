/**
 * @swagger
 * /admin/movies:
 *   post:
 *     tags: [Admin]
 *     summary: Tạo phim mới (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *               - releaseDate
 *               - director
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Avengers: Endgame"
 *               slug:
 *                 type: string
 *                 example: "avengers-endgame"
 *               description:
 *                 type: string
 *                 example: "Sau sự kiện tàn khốc của Infinity War..."
 *               duration:
 *                 type: number
 *                 example: 181
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-26"
 *               director:
 *                 type: string
 *                 example: "Anthony Russo, Joe Russo"
 *               actors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson"]
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["69198f14b80a32bf8ea5d916", "69198f14b80a32bf8ea5d912"]
 *               language:
 *                 type: string
 *                 example: "English"
 *               subtitles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Vietnamese"]
 *               rating:
 *                 type: string
 *                 example: "C13"
 *               posterUrl:
 *                 type: string
 *                 example: "https://image.tmdb.org/t/p/w500/poster.jpg"
 *               trailerUrl:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=TcMBFSGVi1c"
 *               status:
 *                 type: string
 *                 enum: ["Sắp chiếu", "Đang chiếu", "Ngừng chiếu"]
 *                 example: "Đang chiếu"
 *     responses:
 *       201:
 *         description: Tạo phim thành công
 */

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy tất cả đơn vé (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách đơn vé
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách tất cả người dùng (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by Business Status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách người dùng kèm phân trang
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy thông tin chi tiết user (Admin)
 *     description: Bao gồm thông tin cá nhân và thống kê chi tiêu.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
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
 *                     _id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     role:
 *                       type: string
 *                     membershipLevel:
 *                       type: string
 *                     loyaltyPoints:
 *                       type: number
 *                     profilePicture:
 *                       type: string
 *                     spending:
 *                       type: object
 *                       properties:
 *                         totalSpent:
 *                           type: number
 *                         totalBookings:
 *                           type: number
 *                         completedBookings:
 *                           type: number
 *                         cancelledBookings:
 *                           type: number
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/staff/create:
 *   post:
 *     summary: Tạo tài khoản nhân viên mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "staff@cinema.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               phoneNumber:
 *                 type: string
 *                 example: "0901234567"
 *               assignedTheater:
 *                 type: string
 *                 description: "ID của rạp (tùy chọn)"
 *                 example: "69198f14b80a32bf8ea5d91c"
 *     responses:
 *       201:
 *         description: "Tạo tài khoản thành công"
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
 *                   example: "Tạo tài khoản nhân viên thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: "staff"
 *                     staffInfo:
 *                       type: object
 *                       properties:
 *                         assignedTheater:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: "Thông tin không hợp lệ hoặc email đã tồn tại"
 *       401:
 *         description: "Không được phép"
 *       500:
 *         description: "Lỗi server"
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa người dùng (Super Admin)
 *     description: Super Admin có thể xóa user. Không cho phép user tự xóa chính mình.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người dùng cần xóa
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       400:
 *         description: Không thể xóa chính mình
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/movies/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật phim (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               director:
 *                 type: string
 *               actors:
 *                 type: array
 *                 items:
 *                   type: string
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *               subtitles:
 *                 type: array
 *                 items:
 *                   type: string
 *               rating:
 *                 type: string
 *               posterUrl:
 *                 type: string
 *               trailerUrl:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ["Sắp chiếu", "Đang chiếu", "Ngừng chiếu"]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa phim (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/schedules:
 *   post:
 *     tags: [Admin]
 *     summary: Tạo lịch chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *               - theaterId
 *               - roomId
 *               - showDate
 *               - startTime
 *               - endTime
 *               - ticketPrices
 *             properties:
 *               movieId:
 *                 type: string
 *                 example: "69198f14b80a32bf8ea5d92f"
 *               theaterId:
 *                 type: string
 *                 example: "69198f14b80a32bf8ea5d920"
 *               roomId:
 *                 type: string
 *                 example: "69198f14b80a32bf8ea5d921"
 *               roomName:
 *                 type: string
 *                 example: "Phòng 1"
 *               roomType:
 *                 type: string
 *                 example: "2D"
 *               showDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *               startTime:
 *                 type: string
 *                 example: "19:00"
 *               endTime:
 *                 type: string
 *                 example: "21:30"
 *               ticketPrices:
 *                 type: object
 *                 properties:
 *                   standard:
 *                     type: number
 *                     example: 80000
 *                   vip:
 *                     type: number
 *                     example: 120000
 *                   couple:
 *                     type: number
 *                     example: 200000
 *               language:
 *                 type: string
 *                 example: "English"
 *               subtitles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Vietnamese"]
 *     responses:
 *       201:
 *         description: Tạo lịch chiếu thành công
 */

/**
 * @swagger
 * /admin/schedules/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật lịch chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               ticketPrices:
 *                 type: object
 *                 properties:
 *                   standard:
 *                     type: number
 *                   vip:
 *                     type: number
 *                   couple:
 *                     type: number
 *               language:
 *                 type: string
 *               subtitles:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: ["Sắp chiếu", "Đang chiếu", "Đã chiếu", "Đã hủy"]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa lịch chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/schedules/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy chi tiết lịch chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch chiếu
 *     responses:
 *       200:
 *         description: Thông tin chi tiết lịch chiếu
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
 *                   description: Thông tin lịch chiếu sau khi refresh seat availability
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "67a800fcf4a3217d62408c52"
 *                     movie:
 *                       type: object
 *                       properties:
 *                         title: { type: string }
 *                         posterUrl: { type: string }
 *                         duration: { type: number }
 *                         rating: { type: string }
 *                     theater:
 *                       type: object
 *                       properties:
 *                         name: { type: string }
 *                         address: { type: string }
 *                         city: { type: string }
 *                     room:
 *                       type: string
 *                       example: "67a80115f4a3217d62408c57"
 *                     showDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-12-25"
 *                     startTime:
 *                       type: string
 *                       example: "19:00"
 *                     endTime:
 *                       type: string
 *                       example: "21:30"
 *                     status:
 *                       type: string
 *                       example: "Đang mở bán vé"
 *                     ticketPrices:
 *                       type: object
 *                       properties:
 *                         standard: { type: number, example: 80000 }
 *                         vip: { type: number, example: 120000 }
 *                         couple: { type: number, example: 200000 }
 *                     seatAvailability:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           seatNumber: { type: string }
 *                           seatType: { type: string }
 *                           isBooked: { type: boolean }
 *       404:
 *         description: Không tìm thấy lịch chiếu
 */

/**
 * @swagger
 * /admin/schedules/{id}/cancel:
 *   post:
 *     tags: [Admin]
 *     summary: Hủy lịch chiếu (Admin)
 *     description: >
 *       Hủy lịch chiếu và xử lý các booking liên quan:
 *       - Cập nhật trạng thái booking → CANCELLED
 *       - Tự động hoàn tiền (nếu đã thanh toán thành công)
 *       - Trả ghế, rollback voucher, trả lại stock sản phẩm
 *       - Gửi email & SMS thông báo
 *       - Cập nhật lịch chiếu thành "Đã hủy"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch chiếu cần hủy
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Hệ thống bảo trì"
 *     responses:
 *       200:
 *         description: Hủy lịch chiếu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Hủy lịch chiếu thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cancelledBookings:
 *                       type: number
 *                       example: 5
 *                     refundedCount:
 *                       type: number
 *                       example: 3
 *                     cancelledCount:
 *                       type: number
 *                       example: 2
 *                     failedRefunds:
 *                       type: array
 *                       description: Các đơn cần hoàn tiền thủ công
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookingId: { type: string }
 *                           bookingCode: { type: string }
 *                           reason: { type: string }
 *       400:
 *         description: Không thể hủy hoặc đã hủy trước đó
 *       404:
 *         description: Không tìm thấy lịch chiếu
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/theaters:
 *   post:
 *     tags: [Admin]
 *     summary: Tạo rạp chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CGV Vincom"
 *               slug:
 *                 type: string
 *                 example: "cgv-vincom"
 *               address:
 *                 type: string
 *                 example: "191 Bà Triệu, Hai Bà Trưng, Hà Nội"
 *               city:
 *                 type: string
 *                 example: "Hà Nội"
 *               phoneNumber:
 *                 type: string
 *                 example: "1900601700"
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [105.8342, 21.0278]
 *               openingHours:
 *                 type: string
 *                 example: "08:00 - 23:00"
 *     responses:
 *       201:
 *         description: Tạo rạp thành công
 */

/**
 * @swagger
 * /admin/theaters/{theaterId}/rooms:
 *   post:
 *     tags: [Admin]
 *     summary: Thêm phòng chiếu vào rạp (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomName
 *               - roomType
 *               - totalSeats
 *               - rows
 *               - seatsPerRow
 *               - seatMap
 *             properties:
 *               roomName:
 *                 type: string
 *                 example: "Phòng 1"
 *               roomType:
 *                 type: string
 *                 enum: ["2D", "3D", "IMAX", "4DX"]
 *                 example: "2D"
 *               totalSeats:
 *                 type: number
 *                 example: 100
 *               rows:
 *                 type: number
 *                 example: 10
 *               seatsPerRow:
 *                 type: number
 *                 example: 10
 *               seatMap:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                       example: "A1"
 *                     seatType:
 *                       type: string
 *                       enum: [Thường, VIP, Ghế đôi]
 *                       example: "Thường"
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                     row:
 *                       type: string
 *                       example: "A"
 *                     column:
 *                       type: number
 *                       example: 1
 *               screenType:
 *                 type: string
 *                 example: "Standard"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Thêm phòng chiếu thành công
 */

/**
 * @swagger
 * /admin/theaters/{theaterId}/rooms/{roomId}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật phòng chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roomId
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
 *               roomName:
 *                 type: string
 *               roomType:
 *                 type: string
 *                 enum: [2D, 3D, IMAX, 4DX]
 *               totalSeats:
 *                 type: number
 *               rows:
 *                 type: number
 *               seatsPerRow:
 *                 type: number
 *               seatMap:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                       example: "A10"
 *                     seatType:
 *                       type: string
 *                       enum: ["Thường", "VIP", "Ghế đôi"]
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                     row:
 *                       type: string
 *                       example: "A"
 *                     column:
 *                       type: number
 *               screenType:
 *                 type: string
 *                 enum: [Standard, IMAX, Dolby Atmos]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật phòng chiếu thành công
 *
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa phòng chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa phòng chiếu thành công
 */

/**
 * @swagger
 * /admin/theaters/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật thông tin rạp chiếu (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID rạp cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CGV Vincom Bà Triệu"
 *               slug:
 *                 type: string
 *                 example: "cgv-vincom-ba-trieu"
 *               address:
 *                 type: string
 *                 example: "191 Bà Triệu, Hai Bà Trưng, Hà Nội"
 *               city:
 *                 type: string
 *                 example: "Hà Nội"
 *               district:
 *                 type: string
 *                 example: "Hai Bà Trưng"
 *               phoneNumber:
 *                 type: string
 *                 example: "19006017"
 *               rating:
 *                 type: number
 *                 example: 4.5
 *               totalReviews:
 *                 type: number
 *                 example: 350
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Parking", "IMAX", "Restaurant"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               openingHours:
 *                 type: string
 *                 example: "08:00 - 23:00"
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [105.8342, 21.0278]
 *     responses:
 *       200:
 *         description: Cập nhật rạp thành công
 *       404:
 *         description: Không tìm thấy rạp
 *       500:
 *         description: Lỗi server
 */
/**
 * @swagger
 * /admin/theaters/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa rạp chiếu (Admin)
 *     description: >
 *       Thực hiện **soft delete** rạp:
 *       - Không cho phép xóa nếu rạp còn lịch chiếu tương lai
 *       - Không cho phép xóa nếu rạp còn phòng chiếu
 *       - Đặt isActive = false thay vì xóa vĩnh viễn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID rạp cần xóa
 *     responses:
 *       200:
 *         description: Xóa rạp thành công (soft delete)
 *       400:
 *         description: Không thể xóa vì rạp còn phòng chiếu hoặc còn lịch chiếu tương lai
 *       404:
 *         description: Không tìm thấy rạp
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/theaters/{theaterId}/rooms/{roomId}/seats:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Cập nhật nhiều ghế trong một phòng chiếu (Admin)
 *     description: |
 *       Cập nhật nhiều ghế cùng lúc bằng cách truyền danh sách seatNumber và các trường cần thay đổi.
 *       - Không cần gửi toàn bộ seatMap
 *       - Không bị ảnh hưởng bởi validator totalSeats
 *       - Chỉ sửa các key được truyền vào
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của rạp chiếu
 *
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phòng chiếu
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seats
 *             properties:
 *               seats:
 *                 type: array
 *                 description: Danh sách ghế cần cập nhật
 *                 items:
 *                   type: object
 *                   required:
 *                     - seatNumber
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                       example: "A3"
 *                       description: Mã ghế — dùng để xác định ghế trong seatMap
 *
 *                     seatType:
 *                       type: string
 *                       enum: ["Thường", "VIP", "Ghế đôi"]
 *                       example: "VIP"
 *                       description: Loại ghế mới
 *
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                       description: Trạng thái ghế (còn trống hay không)
 *
 *                     row:
 *                       type: string
 *                       example: "A"
 *                       description: Hàng ghế (tùy chọn)
 *
 *                     column:
 *                       type: number
 *                       example: 3
 *                       description: Số cột (tùy chọn)
 *
 *     responses:
 *       200:
 *         description: Cập nhật nhiều ghế thành công
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
 *                   example: "Cập nhật nhiều ghế thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *
 *       400:
 *         description: Dữ liệu ghế không hợp lệ
 *
 *       404:
 *         description: Không tìm thấy rạp hoặc phòng chiếu
 *
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/genres:
 *   post:
 *     tags: [Admin]
 *     summary: Tạo thể loại (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hành động"
 *               slug:
 *                 type: string
 *                 example: "hanh-dong"
 *               description:
 *                 type: string
 *                 example: "Phim hành động gay cấn"
 *               icon:
 *                 type: string
 *                 example: "🎬"
 *               color:
 *                 type: string
 *                 example: "#FF5733"
 *     responses:
 *       201:
 *         description: Tạo thể loại thành công
 */

/**
 * @swagger
 * /admin/genres/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật thể loại phim (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thể loại cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hành động"
 *               slug:
 *                 type: string
 *                 example: "hanh-dong"
 *               description:
 *                 type: string
 *                 example: "Thể loại phim hành động gay cấn"
 *               icon:
 *                 type: string
 *                 example: "🔥"
 *               color:
 *                 type: string
 *                 example: "#FF5733"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               displayOrder:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Cập nhật thể loại thành công
 *       404:
 *         description: Không tìm thấy thể loại
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/genres/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa thể loại phim (Admin)
 *     description: Xóa thể loại khỏi hệ thống (xóa cứng).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thể loại cần xóa
 *     responses:
 *       200:
 *         description: Xóa thể loại thành công
 *       404:
 *         description: Không tìm thấy thể loại
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/products:
 *   post:
 *     tags: [Admin]
 *     summary: Tạo sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bắp rang bơ lớn"
 *               slug:
 *                 type: string
 *                 example: "bap-rang-bo-lon"
 *               description:
 *                 type: string
 *                 example: "Bắp rang bơ thơm ngon"
 *               category:
 *                 type: string
 *                 enum: [Popcorn, Drink, Combo, Snack]
 *                 example: "Popcorn"
 *               price:
 *                 type: number
 *                 example: 50000
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/popcorn.jpg"
 *               inStock:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách vouchers (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách vouchers
 *   post:
 *     tags: [Admin]
 *     summary: Tạo voucher (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - description
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *               - usageLimit
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUMMER2024"
 *               description:
 *                 type: string
 *                 example: "Giảm giá mùa hè"
 *               discountType:
 *                 type: string
 *                 enum: [fixed, percent]
 *                 example: "percent"
 *               discountValue:
 *                 type: number
 *                 example: 20
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 50000
 *               minOrderValue:
 *                 type: number
 *                 example: 100000
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-31"
 *               usageLimit:
 *                 type: number
 *                 example: 100
 *               usageLimitPerUser:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 */

/**
 * @swagger
 * /admin/bookings/check-in:
 *   post:
 *     tags: [Admin]
 *     summary: Check-in vé tại rạp (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingCode: { type: string }
 *     responses:
 *       200:
 *         description: Check-in thành công
 */

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy tất cả đánh giá (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: "Đã duyệt"
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/reviews/{id}/approve:
 *   put:
 *     tags: [Admin]
 *     summary: Duyệt đánh giá (Admin)
 *     description: Đặt trạng thái đánh giá thành "Đã duyệt".
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá cần duyệt
 *     responses:
 *       200:
 *         description: Duyệt đánh giá thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 *       500:
 *         description: Lỗi server
 */
/**
 * @swagger
 * /admin/reviews/{id}/reject:
 *   put:
 *     tags: [Admin]
 *     summary: Từ chối đánh giá (Admin)
 *     description: >
 *       Đặt trạng thái đánh giá thành "Bị từ chối".
 *       Admin có thể truyền lý do từ chối.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá cần từ chối
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Nội dung không phù hợp"
 *     responses:
 *       200:
 *         description: Từ chối đánh giá thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 *       500:
 *         description: Lỗi server
 */
/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa đánh giá (Admin)
 *     description: Xóa đánh giá khỏi hệ thống (xóa cứng).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đánh giá cần xóa
 *     responses:
 *       200:
 *         description: Xóa đánh giá thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/statistics/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Thống kê tổng quan (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu thống kê
 */

/**
 * @swagger
 * /admin/statistics/movies:
 *   get:
 *     tags: [Admin]
 *     summary: Thống kê phim (Admin)
 *     description: >
 *       Lấy thống kê phim theo doanh thu, số vé bán, thể loại và tỷ lệ lấp đầy phòng chiếu.
 *       Có thể lọc theo khoảng thời gian và giới hạn số lượng phim.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         example: "2024-01-01"
 *         description: "Ngày bắt đầu lọc dữ liệu"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         example: "2024-01-31"
 *         description: "Ngày kết thúc lọc dữ liệu"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         required: false
 *         description: "Giới hạn số lượng phim trả về (mặc định 10)"
 *     responses:
 *       200:
 *         description: Thống kê phim thành công
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
 *                     topMoviesByRevenue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "Avengers: Endgame"
 *                           totalRevenue:
 *                             type: number
 *                             example: 1500000000
 *                           totalBookings:
 *                             type: number
 *                             example: 34000
 *                           totalTickets:
 *                             type: number
 *                             example: 55000
 *                     topMoviesByTickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "Avatar 2"
 *                           totalTickets:
 *                             type: number
 *                             example: 70000
 *                           totalRevenue:
 *                             type: number
 *                             example: 1200000000
 *                           totalBookings:
 *                             type: number
 *                             example: 40000
 *                     genreStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "Hành động"
 *                           totalRevenue:
 *                             type: number
 *                             example: 500000000
 *                           totalBookings:
 *                             type: number
 *                             example: 12000
 *                     occupancyRate:
 *                       type: object
 *                       properties:
 *                         avgOccupancy:
 *                           type: number
 *                           example: 65.5
 *                         totalSeats:
 *                           type: number
 *                           example: 200000
 *                         bookedSeats:
 *                           type: number
 *                           example: 131000
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/statistics/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Thống kê doanh thu (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu doanh thu
 */

export default {};
