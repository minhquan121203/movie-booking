/**
 * @swagger
 * /admin/movies/{movieId}/upload-poster:
 *   post:
 *     tags: [Upload]
 *     summary: Upload poster phim (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               poster:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */

/**
 * @swagger
 * /users/upload-avatar:
 *   post:
 *     tags: [Upload]
 *     summary: Upload avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */

/**
 * @swagger
 * /admin/products/{productId}/upload-image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload ảnh sản phẩm (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */

/**
 * @swagger
 * /admin/banners/upload:
 *   post:
 *     tags: [Admin]
 *     summary: Upload banner (Admin)
 *     description: >
 *       Upload banner mới hoặc cập nhật banner nếu truyền vào bannerId.  
 *       Hỗ trợ upload dạng multipart/form-data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bannerId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID banner cần cập nhật (nếu không có → tạo banner mới)
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
 *                 description: File ảnh banner
 *     responses:
 *       200:
 *         description: Upload banner thành công
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
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/.../banner.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "cinema/banner/abc123"
 *                 message:
 *                   type: string
 *                   example: "Upload banner thành công"
 *       400:
 *         description: Không có file upload
 *       404:
 *         description: Không tìm thấy banner để cập nhật
 *       500:
 *         description: Lỗi server
 */
/**
 * @swagger
 * /admin/upload/multiple:
 *   post:
 *     tags: [Admin]
 *     summary: Upload nhiều ảnh (Admin)
 *     description: Upload nhiều file ảnh lên Cloudinary. Trả về danh sách URL và publicId của từng ảnh.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 description: Danh sách file ảnh cần upload
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - images
 *     responses:
 *       200:
 *         description: Upload nhiều ảnh thành công
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
 *                       url:
 *                         type: string
 *                         example: "https://res.cloudinary.com/.../image1.jpg"
 *                       publicId:
 *                         type: string
 *                         example: "cinema/general/abc123"
 *                 message:
 *                   type: string
 *                   example: "Upload 3 ảnh thành công"
 *       400:
 *         description: Không có file nào được chọn
 *       500:
 *         description: Lỗi server
 */
/**
 * @swagger
 * /admin/upload/{publicId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa ảnh theo publicId (Admin)
 *     description: Xóa ảnh trên Cloudinary bằng publicId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary publicId của ảnh cần xóa
 *         example: "cinema/general/abc123"
 *     responses:
 *       200:
 *         description: Xóa ảnh thành công
 *       500:
 *         description: Xóa ảnh thất bại hoặc lỗi server
 */


export default {};
