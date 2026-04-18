/**
 * @swagger
 * /reviews/movie/{movieId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Lấy danh sách đánh giá theo phim kèm phân trang và bộ lọc
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phim cần lấy đánh giá
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Trang hiện tại (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *         description: Số đánh giá mỗi trang (mặc định 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["Đã duyệt", "Chờ duyệt", "Bị từ chối"]
 *         description: Lọc đánh giá theo trạng thái
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         example: 5
 *         description: Lọc đánh giá theo số sao (1–5)
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status
 *     responses:
 *       200:
 *         description: Danh sách đánh giá + phân trang + thống kê rating
 *       400:
 *         description: Lỗi query filter (ví dụ rating không hợp lệ)
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Tạo đánh giá mới
 *     description: Người dùng chỉ được đánh giá phim một lần. Mặc định trạng thái là "Chờ duyệt".
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, movieId]
 *             properties:
 *               movieId:
 *                 type: string
 *                 example: "67a8c3a4e23d92b7a1cd9c34"
 *                 description: ID phim (hoặc dùng key "movie" đều được)
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Phim rất hay, hiệu ứng tốt!"
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
 *       400:
 *         description: Lỗi dữ liệu hoặc người dùng đã đánh giá trước đó
 *       404:
 *         description: Không tìm thấy phim
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Cập nhật đánh giá
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
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Reviews]
 *     summary: Xóa đánh giá
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

export default {};
