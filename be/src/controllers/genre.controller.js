import Genre from "../models/genre.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const genreController = {
  getAllGenres: async (req, res) => {
    try {
      const {
        search,
        isActive,
        sortBy = "displayOrder",
        order = "asc",
        page = 1, // Mặc định trang 1
        limit = 10, // Mặc định 10 dòng/trang
      } = req.query;

      const query = {};

      // 1. Xử lý Filter
      Object.assign(query, getDeleteFilter(req.query));
      
      if (typeof isActive !== "undefined") {
        query.isActive = isActive === "true";
      }

      // Tìm kiếm theo name / slug / description
      if (search) {
        const regex = new RegExp(search, "i");
        query.$or = [{ name: regex }, { slug: regex }, { description: regex }];
      }

      // 2. Xử lý Sort
      const allowedSortFields = ["displayOrder", "name", "createdAt", "updatedAt"];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : "displayOrder";
      const sort = { [sortField]: order === "desc" ? -1 : 1 };

      // 3. Xử lý Pagination
      const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
      const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
      const skip = (pageNum - 1) * limitNum;

      // 4. Thực thi query (Song song: lấy data và đếm tổng số lượng)
      const [genres, totalGenres] = await Promise.all([
        Genre.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
        Genre.countDocuments(query),
      ]);

      // 5. Trả về kết quả kèm metadata phân trang
      const responseData = {
        items: genres,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalGenres / limitNum),
          totalItems: totalGenres,
          itemsPerPage: limitNum,
        },
      };

      return successResponse(res, responseData);
    } catch (error) {
      console.error("Get all genres error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  getGenreById: async (req, res) => {
    try {
      const { id } = req.params;

      const genre = await Genre.findById(id).lean();
      if (!genre) {
        return errorResponse(res, "Không tìm thấy thể loại", 404);
      }

      return successResponse(res, genre);
    } catch (error) {
      console.error("Get genre by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  createGenre: async (req, res) => {
    try {
      const genreData = req.body;

      const newGenre = new Genre(genreData);
      await newGenre.save();

      return successResponse(res, newGenre, "Tạo thể loại thành công", 201);
    } catch (error) {
      console.error("Create genre error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  updateGenre: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const genre = await Genre.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!genre) {
        return errorResponse(res, "Không tìm thấy thể loại", 404);
      }

      return successResponse(res, genre, "Cập nhật thể loại thành công");
    } catch (error) {
      console.error("Update genre error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  deleteGenre: async (req, res) => {
    try {
      const { id } = req.params;

      const genre = await Genre.findById(id);
      if (!genre) {
        return errorResponse(res, "Không tìm thấy thể loại", 404);
      }
      // Soft Delete
      genre.isDeleted = true;
      await genre.save();
      // const genre = await Genre.findByIdAndDelete(id);
      if (!genre) {
        return errorResponse(res, "Không tìm thấy thể loại", 404);
      }

      return successResponse(res, {}, "Xóa thể loại thành công");
    } catch (error) {
      console.error("Delete genre error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default genreController;
