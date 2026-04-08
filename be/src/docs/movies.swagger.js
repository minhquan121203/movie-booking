/**
 * @swagger
 * /movies:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Lấy danh sách phim (có filter)
 *     parameters:
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
 *           default: 12
 *         description: Số phim mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Sắp chiếu, Đang chiếu, Ngừng chiếu]
 *         description: Trạng thái phim (Movie.status)
 *       - in: query
 *         name: genres
 *         schema:
 *           type: string
 *         description: >
 *           Danh sách ID thể loại, cách nhau dấu phẩy.  
 *           Ví dụ: 6610a6d2f0...,6610a6e4f1...
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: >
 *           Quốc gia sản xuất. Có thể truyền nhiều giá trị cách nhau dấu phẩy, ví dụ: Mỹ,Hàn Quốc,Nhật Bản.
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *           description: Rating độ tuổi của phim. Có thể truyền 1 hoặc nhiều, ví dụ "P" hoặc "P,C13".
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Ngôn ngữ gốc của phim (Movie.language)
 *       - in: query
 *         name: subtitle
 *         schema:
 *           type: string
 *         description: >
 *           Phụ đề hỗ trợ (nằm trong mảng Movie.subtitles).  
 *           Ví dụ: "Tiếng Việt", "Tiếng Anh".
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm phát hành (lọc theo Movie.releaseDate)
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *         description: Thời lượng tối thiểu (phút)
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: integer
 *         description: Thời lượng tối đa (phút)
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *         description: Giới hạn tuổi tối thiểu (ageRestriction)
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Giới hạn tuổi tối đa (ageRestriction)
 *       - in: query
 *         name: minAverageRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Điểm đánh giá trung bình tối thiểu (0–5)
 *       - in: query
 *         name: maxAverageRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Điểm đánh giá trung bình tối đa (0–5)
 *       - in: query
 *         name: minViewCount
 *         schema:
 *           type: integer
 *         description: Lượt xem tối thiểu
 *       - in: query
 *         name: maxViewCount
 *         schema:
 *           type: integer
 *         description: Lượt xem tối đa
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: >
 *           Từ khóa tìm kiếm (theo tiêu đề, đạo diễn, diễn viên).
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: releaseDate
 *           enum: [releaseDate, createdAt, updatedAt, averageRating, totalReviews, viewCount, title, duration, totalRevenue]
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp (tăng dần / giảm dần)
 *     responses:
 *       200:
 *         description: Danh sách phim (kèm phân trang)
 *       500:
 *         description: Lỗi server
 */


/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Lấy chi tiết phim
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết phim
 */

/**
 * @swagger
 * /movies/now-showing:
 *   get:
 *     tags: [Movies]
 *     summary: Phim đang chiếu
 *     responses:
 *       200:
 *         description: Danh sách phim đang chiếu
 */

/**
 * @swagger
 * /movies/upcoming:
 *   get:
 *     tags: [Movies]
 *     summary: Phim sắp chiếu
 *     responses:
 *       200:
 *         description: Danh sách phim sắp chiếu
 */

/**
 * @swagger
 * /movies/genre/{genreId}:
 *   get:
 *     tags: [Movies]
 *     summary: Lấy phim theo thể loại
 *     parameters:
 *       - in: path
 *         name: genreId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách phim theo thể loại
 */

/**
 * @swagger
 * /admin/movies/sync-tmdb:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Đồng bộ phim mới từ TMDB (Dành cho Admin)
 *     description: Tự động gọi API của TMDB để kéo danh sách phim đang hot, lấy đủ poster, diễn viên, đạo diễn và tự động map thể loại vào DB.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
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
 *                   example: "Húp thành công! Đã thêm 15 phim mới."
 *                 data:
 *                   type: object
 *                   properties:
 *                     addedCount:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Chưa đăng nhập (Không có token)
 *       403:
 *         description: Không có quyền hạn (Không phải Admin)
 *       500:
 *         description: Lỗi Server hoặc API TMDB không phản hồi
 */

export default {};
