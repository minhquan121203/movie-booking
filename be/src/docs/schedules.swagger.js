/**
 * @swagger
 * /schedules:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Lấy danh sách lịch chiếu (có filter)
 *     description: >
 *       Lọc lịch chiếu theo phim, rạp, ngày chiếu, thông tin phim (quốc gia, thể loại, rating, năm phát hành, v.v..)  
 *       và sắp xếp theo nhiều tiêu chí (mới nhất, lượt xem, rating...).
 *     parameters:
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *         description: ID phim
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *         description: ID rạp
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc theo một ngày chiếu cụ thể (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu khoảng thời gian chiếu (kết hợp với endDate)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc khoảng thời gian chiếu (kết hợp với startDate)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Sắp chiếu, Đang mở bán vé, Sắp đầy, Hết vé, Đã chiếu, Đã hủy]
 *         description: Trạng thái suất chiếu (Schedule.status)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: >
 *           Quốc gia của phim. Có thể truyền nhiều giá trị cách nhau dấu phẩy, ví dụ: "Mỹ,Hàn Quốc,Nhật Bản".
 *       - in: query
 *         name: movieStatus
 *         schema:
 *           type: string
 *           enum: [Sắp chiếu, Đang chiếu, Ngừng chiếu]
 *         description: Trạng thái phim (Movie.status)
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *           enum: [P, C13, C16, C18]
 *         description: Rating độ tuổi của phim (Movie.rating)
 *       - in: query
 *         name: genres
 *         schema:
 *           type: string
 *         description: >
 *           Danh sách ID thể loại (Genre._id), cách nhau dấu phẩy.  
 *           Ví dụ: "6610a6d2f0...,6610a6e4f1..."
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Ngôn ngữ suất chiếu (Schedule.language)
 *       - in: query
 *         name: subtitle
 *         schema:
 *           type: string
 *         description: >
 *           Phụ đề của suất chiếu (Schedule.subtitles).  
 *           Ví dụ: "Tiếng Việt", "Không phụ đề", "Lồng tiếng".
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm phát hành phim (lọc theo Movie.releaseDate)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, updated, rating, views]
 *         description: >
 *           Tiêu chí sắp xếp:  
 *           - latest: phim mới phát hành nhất  
 *           - updated: lịch chiếu cập nhật gần nhất  
 *           - rating: điểm đánh giá trung bình cao nhất (Movie.averageRating)  
 *           - views: lượt xem nhiều nhất (Movie.viewCount)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Trang hiện tại (phân trang)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *         description: Số item mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách lịch chiếu (kèm phân trang)
 *       500:
 *         description: Lỗi server
 */


/**
 * @swagger
 * /schedules/movie/{movieId}:
 *   get:
 *     tags: [Schedules]
 *     summary: Lịch chiếu theo phim
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lịch chiếu của phim
 */

/**
 * @swagger
 * /schedules/theater/{theaterId}:
 *   get:
 *     tags: [Schedules]
 *     summary: Lịch chiếu theo rạp
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lịch chiếu của rạp
 */

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     tags: [Schedules]
 *     summary: Chi tiết lịch chiếu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết lịch chiếu
 */

export default {};
