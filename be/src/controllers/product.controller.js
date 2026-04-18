import Product from '../models/product.model.js';
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const { category, inStock, isActive } = req.query;
            
            const query = {
                ...getDeleteFilter(req.query)
            };
            if (category) query.category = category;
            if (inStock !== undefined) query.inStock = inStock === 'true';
            
            // Business status filter
            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            }

            const products = await Product.find(query).sort({ category: 1, name: 1 }).lean();

            return successResponse(res, products);
        } catch (error) {
            console.error('Get all products error:', error);
            return errorResponse(res, 'Lỗi server', 500);
        }
    },

    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const product = await Product.findById(id).lean();
            if (!product) {
                return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
            }

            return successResponse(res, product);
        } catch (error) {
            console.error('Get product by id error:', error);
            return errorResponse(res, 'Lỗi server', 500);
        }
    },

    createProduct: async (req, res) => {
        try {
            const productData = req.body;
            productData.createdBy = req.userId;

            const newProduct = new Product(productData);
            await newProduct.save();

            return successResponse(res, newProduct, 'Tạo sản phẩm thành công', 201);
        } catch (error) {
            console.error('Create product error:', error);
            return errorResponse(res, 'Lỗi server', 500);
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            updateData.updatedBy = req.userId;

            const product = await Product.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!product) {
                return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
            }

            return successResponse(res, product, 'Cập nhật sản phẩm thành công');
        } catch (error) {
            console.error('Update product error:', error);
            return errorResponse(res, 'Lỗi server', 500);
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
            }
            // Soft delete
            product.isDeleted = true;
            await product.save();

            return successResponse(res, {}, 'Xóa sản phẩm thành công');
        } catch (error) {
            console.error('Delete product error:', error);
            return errorResponse(res, 'Lỗi server', 500);
        }
    }
};

export default productController;