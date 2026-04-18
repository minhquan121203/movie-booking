import cloudinaryService from "../services/cloudinary.service.js";
import Movie from "../models/movie.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Banner from "../models/banner.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

const uploadController = {
  // Upload movie poster
  uploadMoviePoster: async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, "Vui lòng chọn file ảnh", 400);
      }

      const { movieId } = req.params;
      const movie = await Movie.findById(movieId);

      if (!movie) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }

      // Delete old poster if exists
      if (movie.posterPublicId) {
        await cloudinaryService.deleteImage(movie.posterPublicId);
      }

      // Upload new poster
      const result = await cloudinaryService.uploadMoviePoster(req.file.buffer, movie.title);

      if (result.success) {
        // Update movie
        movie.posterUrl = result.url;
        movie.posterPublicId = result.publicId;
        movie.updatedBy = req.userId;
        await movie.save();

        return successResponse(
          res,
          {
            url: result.url,
            publicId: result.publicId,
          },
          "Upload poster thành công"
        );
      } else {
        return errorResponse(res, "Upload thất bại", 500);
      }
    } catch (error) {
      console.error("Upload movie poster error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Upload user avatar
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, "Vui lòng chọn file ảnh", 400);
      }

      const user = await User.findById(req.userId);

      // Delete old avatar if exists
      if (user.cloudinaryPublicId) {
        await cloudinaryService.deleteImage(user.cloudinaryPublicId);
      }

      // Upload new avatar
      const result = await cloudinaryService.uploadAvatar(req.file.buffer, user._id);

      if (result.success) {
        // Update user
        user.profilePicture = result.url;
        user.cloudinaryPublicId = result.publicId;
        await user.save();

        return successResponse(
          res,
          {
            url: result.url,
            publicId: result.publicId,
          },
          "Upload avatar thành công"
        );
      } else {
        return errorResponse(res, "Upload thất bại", 500);
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Upload product image
  uploadProductImage: async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, "Vui lòng chọn file ảnh", 400);
      }

      const { productId } = req.params;
      const product = await Product.findById(productId);

      if (!product) {
        return errorResponse(res, "Không tìm thấy sản phẩm", 404);
      }

      // Delete old image if exists
      if (product.imagePublicId) {
        await cloudinaryService.deleteImage(product.imagePublicId);
      }

      // Upload new image
      const result = await cloudinaryService.uploadProductImage(req.file.buffer, product.name);

      if (result.success) {
        // Update product
        product.imageUrl = result.url;
        product.imagePublicId = result.publicId;
        product.updatedBy = req.userId;
        await product.save();

        return successResponse(
          res,
          {
            url: result.url,
            publicId: result.publicId,
          },
          "Upload hình ảnh sản phẩm thành công"
        );
      } else {
        return errorResponse(res, "Upload thất bại", 500);
      }
    } catch (error) {
      console.error("Upload product image error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Upload banner
  uploadBanner: async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, "Vui lòng chọn file ảnh", 400);
      }

      const { bannerId } = req.params;

      if (bannerId) {
        // Update existing banner
        const banner = await Banner.findById(bannerId);
        if (!banner) {
          return errorResponse(res, "Không tìm thấy banner", 404);
        }

        // Delete old image
        if (banner.imagePublicId) {
          await cloudinaryService.deleteImage(banner.imagePublicId);
        }

        const result = await cloudinaryService.uploadBanner(req.file.buffer);

        if (result.success) {
          banner.imageUrl = result.url;
          banner.imagePublicId = result.publicId;
          banner.updatedBy = req.userId;
          await banner.save();

          return successResponse(
            res,
            {
              url: result.url,
              publicId: result.publicId,
            },
            "Upload banner thành công"
          );
        } else {
          return errorResponse(res, "Upload thất bại", 500);
        }
      } else {
        // Create new banner
        const result = await cloudinaryService.uploadBanner(req.file.buffer);

        if (result.success) {
          return successResponse(
            res,
            {
              url: result.url,
              publicId: result.publicId,
            },
            "Upload banner thành công"
          );
        } else {
          return errorResponse(res, "Upload thất bại", 500);
        }
      }
    } catch (error) {
      console.error("Upload banner error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Upload multiple images
  uploadMultiple: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return errorResponse(res, "Vui lòng chọn ít nhất 1 file ảnh", 400);
      }

      const uploadPromises = req.files.map((file) =>
        cloudinaryService.uploadFromBuffer(file.buffer, {
          folder: "cinema/general",
        })
      );

      const results = await Promise.all(uploadPromises);

      const successResults = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      return successResponse(res, successResults, `Upload ${successResults.length} ảnh thành công`);
    } catch (error) {
      console.error("Upload multiple error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Delete image
  deleteImage: async (req, res) => {
    try {
      const { publicId } = req.params;

      const result = await cloudinaryService.deleteImage(publicId);

      if (result.success) {
        return successResponse(res, {}, "Xóa ảnh thành công");
      } else {
        return errorResponse(res, "Xóa ảnh thất bại", 500);
      }
    } catch (error) {
      console.error("Delete image error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Get image details
  getImageDetails: async (req, res) => {
    try {
      const { publicId } = req.params;

      const result = await cloudinaryService.getImageDetails(publicId);

      if (result.success) {
        return successResponse(res, result.data);
      } else {
        return errorResponse(res, "Không tìm thấy ảnh", 404);
      }
    } catch (error) {
      console.error("Get image details error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default uploadController;
