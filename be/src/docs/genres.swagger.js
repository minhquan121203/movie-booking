/**
 * @swagger
 * /genres:
 *   get:
 *     tags:
 *       - Genres
 *     summary: Lấy danh sách thể loại phim (có filter & pagination)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, slug hoặc mô tả thể loại
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: true
 *         description: Filter by Soft Delete status (true=live, false=deleted, all=both)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Lọc theo trạng thái hoạt động của thể loại
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng item trên một trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: displayOrder
 *           enum: [displayOrder, name, createdAt, updatedAt]
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
 *         description: Danh sách thể loại kèm thông tin phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Genre'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /genres/{id}:
 *   get:
 *     tags: [Genres]
 *     summary: Chi tiết thể loại
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết thể loại
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Genre:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của thể loại
 *         name:
 *           type: string
 *           description: Tên thể loại
 *         slug:
 *           type: string
 *           description: Slug (URL friendly)
 *         description:
 *           type: string
 *           description: Mô tả
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         isDeleted:
 *           type: boolean
 *           description: Trạng thái xóa mềm
 *         displayOrder:
 *           type: integer
 *           description: Thứ tự hiển thị
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default {};
