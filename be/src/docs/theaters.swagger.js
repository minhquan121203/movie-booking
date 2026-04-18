/**
 * @swagger
 * /theaters:
 *   get:
 *     tags:
 *       - Theaters
 *     summary: Lấy danh sách rạp chiếu (có filter)
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
 *           default: 10
 *         description: Số rạp mỗi trang
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Lọc theo thành phố (regex, không phân biệt hoa thường)
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status (true=live, false=deleted, all=both)
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Lọc theo quận / huyện (regex)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Trạng thái hoạt động của rạp
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc địa chỉ rạp
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *         description: >
 *           Lọc theo loại phòng chiếu, cách nhau dấu phẩy.  
 *           Giá trị hợp lệ: "2D", "3D", "IMAX", "4DX".
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: city
 *           enum: [city, name, rating, totalReviews, createdAt, updatedAt]
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: asc
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Danh sách rạp (kèm phân trang)
 *       500:
 *         description: Lỗi server
 */


/**
 * @swagger
 * /theaters/{id}:
 *   get:
 *     tags: [Theaters]
 *     summary: Chi tiết rạp chiếu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết rạp
 */

/**
 * @swagger
 * /theaters/city/{city}:
 *   get:
 *     tags: [Theaters]
 *     summary: Rạp theo thành phố
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách rạp theo thành phố
 */

export default {};
