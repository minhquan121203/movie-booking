import Voucher from "../models/voucher.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const voucherController = {
  verifyVoucher: async (req, res) => {
    try {
      const { code, orderValue } = req.body;

      const voucher = await Voucher.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });

      if (!voucher) {
        return errorResponse(res, "Mã voucher không tồn tại", 404);
      }

      // Validate
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        return errorResponse(res, "Voucher đã hết hạn hoặc chưa đến thời gian sử dụng", 400);
      }

      if (voucher.usageCount >= voucher.usageLimit) {
        return errorResponse(res, "Voucher đã hết lượt sử dụng", 400);
      }

      if (orderValue < voucher.minOrderValue) {
        return errorResponse(res, `Đơn hàng tối thiểu ${voucher.minOrderValue}đ`, 400);
      }

      // Tính discount
      let discountAmount = 0;
      if (voucher.discountType === "fixed") {
        discountAmount = voucher.discountValue;
      } else {
        discountAmount = Math.floor((orderValue * voucher.discountValue) / 100);
      }

      return successResponse(res, {
        voucher: {
          code: voucher.code,
          description: voucher.description,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
        },
        discountAmount,
        finalAmount: orderValue - discountAmount,
      });
    } catch (error) {
      console.error("Verify voucher error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  getAllVouchers: async (req, res) => {
    try {
      const { isActive } = req.query;

      const query = {
        ...getDeleteFilter(req.query)
      };
      
      // Support filtering by business status isActive
      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }
      
      const vouchers = await Voucher.find(query).sort({ createdAt: -1 }).lean();

      return successResponse(res, vouchers);
    } catch (error) {
      console.error("Get all vouchers error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  createVoucher: async (req, res) => {
    try {
      const voucherData = req.body;

      const newVoucher = new Voucher(voucherData);
      await newVoucher.save();

      return successResponse(res, newVoucher, "Tạo voucher thành công", 201);
    } catch (error) {
      console.error("Create voucher error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  updateVoucher: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const voucher = await Voucher.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!voucher) {
        return errorResponse(res, "Không tìm thấy voucher", 404);
      }

      return successResponse(res, voucher, "Cập nhật voucher thành công");
    } catch (error) {
      console.error("Update voucher error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  deleteVoucher: async (req, res) => {
    try {
      const { id } = req.params;

      const voucher = await Voucher.findById(id);
      if (!voucher) {
        return errorResponse(res, "Không tìm thấy voucher", 404);
      }
      
      voucher.isDeleted = true;
      await voucher.save();
      
      return successResponse(res, {}, "Xóa voucher thành công");
    } catch (error) {
      console.error("Delete voucher error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default voucherController;
