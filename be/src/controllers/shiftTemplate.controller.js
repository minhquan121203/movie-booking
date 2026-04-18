import ShiftTemplate from "../models/shiftTemplate.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

const shiftTemplateController = {
  list: async (req, res) => {
    try {
      const { active } = req.query;
      const q = {};
      
      if (active === "true" || active === undefined) {
        q.isActive = true;
      } else if (active === "false") {
        q.isActive = false;
      }
      // if active === 'all', do not filter by isActive

      const templates = await ShiftTemplate.find(q).sort({ code: 1 }).lean();
      return successResponse(res, templates);
    } catch (err) {
      console.error("List shift templates error:", err);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  create: async (req, res) => {
    try {
      const payload = req.body;
      const tpl = await ShiftTemplate.create({ ...payload, createdBy: req.userId });
      return successResponse(res, tpl, "Tạo ca mẫu thành công", 201);
    } catch (err) {
      console.error("Create shift template error:", err);
      return errorResponse(res, err.message || "Lỗi server", 500);
    }
  },

  getById: async (req, res) => {
    try {
      const tpl = await ShiftTemplate.findById(req.params.id).lean();
      if (!tpl) return errorResponse(res, "Không tìm thấy ca mẫu", 404);
      return successResponse(res, tpl);
    } catch (err) {
      console.error("Get shift template error:", err);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  update: async (req, res) => {
    try {
      const update = req.body;
      const tpl = await ShiftTemplate.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
      if (!tpl) return errorResponse(res, "Không tìm thấy ca mẫu", 404);
      return successResponse(res, tpl, "Cập nhật thành công");
    } catch (err) {
      console.error("Update shift template error:", err);
      return errorResponse(res, err.message || "Lỗi server", 500);
    }
  },

  remove: async (req, res) => {
    try {
      // soft-delete
      const tpl = await ShiftTemplate.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!tpl) return errorResponse(res, "Không tìm thấy ca mẫu", 404);
      return successResponse(res, tpl, "Đã tắt ca mẫu");
    } catch (err) {
      console.error("Remove shift template error:", err);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default shiftTemplateController;
