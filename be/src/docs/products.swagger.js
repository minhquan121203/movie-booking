/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Lấy tất cả sản phẩm
 *     parameters:
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
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm (bắp rang, nước, combo...)
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Chi tiết sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 */

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bắp rang bơ lớn"
 *               slug:
 *                 type: string
 *                 example: "bap-rang-bo-lon"
 *               description:
 *                 type: string
 *                 example: "Bắp rang bơ thơm ngon, giòn rụm"
 *               category:
 *                 type: string
 *                 enum: [Popcorn, Drink, Combo, Snack]
 *                 example: "Popcorn"
 *               price:
 *                 type: number
 *                 example: 45000
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/popcorn.jpg"
 *               inStock:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /admin/products/{productId}/upload-image:
 *   post:
 *     tags: [Admin]
 *     summary: Upload ảnh sản phẩm (Admin)
 *     description: Upload ảnh và cập nhật imageUrl của sản phẩm.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần upload ảnh
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload ảnh thành công
 *       400:
 *         description: Không có file hoặc file không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi server
 */


export default {};
