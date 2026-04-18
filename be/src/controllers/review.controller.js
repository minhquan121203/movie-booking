import mongoose from "mongoose";
import Movie from "../models/movie.model.js";
import Review from "../models/review.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const reviewController = {
  // Lấy đánh giá theo phim
  getReviewsByMovie: async (req, res) => {
    try {
      const { movieId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      // Optional filters
      const statusParam = req.query.status; // if not provided, default to "Đã duyệt" for statistics
      const ratingParam = req.query.rating;

      // Validate rating if provided
      let ratingFilter;
      if (ratingParam !== undefined) {
        const parsed = parseInt(ratingParam, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 5) {
          return errorResponse(res, "Rating filter phải là số từ 1 đến 5", 400);
        }
        ratingFilter = parsed;
      }

      const skip = (page - 1) * limit;

      // Build query for list/count
      const query = { movie: movieId, ...getDeleteFilter(req.query) };
      if (statusParam) query.status = statusParam;
      if (ratingFilter) query.rating = ratingFilter;

      // Build aggregate match for statistics. If status param not provided, default stats to approved reviews (Đã duyệt)
      const aggMatch = { movie: new mongoose.Types.ObjectId(movieId) };
      if (statusParam) aggMatch.status = statusParam;
      else aggMatch.status = "Đã duyệt";
      if (ratingFilter) aggMatch.rating = ratingFilter;

      const [reviews, total, avgRating] = await Promise.all([
        Review.find(query)
          .populate("customer", "fullName profilePicture")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Review.countDocuments(query),
        Review.aggregate([
          { $match: aggMatch },
          { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
        ]),
      ]);

      return successResponse(res, {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
        statistics: avgRating[0] || { avgRating: 0, totalReviews: 0 },
      });
    } catch (error) {
      console.error("Get reviews by movie error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Tạo đánh giá mới
  createReview: async (req, res) => {
    try {
      const { movieId, movie, rating, comment } = req.body;
      const movieIdToUse = movieId || movie;

      // Validate input
      if (!movieIdToUse || !rating) {
        return errorResponse(res, "Movie ID và rating là bắt buộc", 400);
      }

      if (rating < 1 || rating > 5) {
        return errorResponse(res, "Rating phải từ 1 đến 5", 400);
      }

      // Kiểm tra movie tồn tại
      const movieDoc = await Movie.findById(movieIdToUse);
      if (!movieDoc) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }

      // Kiểm tra đã review chưa
      const existingReview = await Review.findOne({
        customer: req.userId,
        movie: movieIdToUse,
      });

      if (existingReview) {
        return errorResponse(res, "Bạn đã đánh giá phim này rồi", 400);
      }

      const newReview = new Review({
        customer: req.userId,
        movie: movieIdToUse,
        rating,
        comment,
        status: "Chờ duyệt", // Auto approve nếu muốn: 'Đã duyệt'
      });

      await newReview.save();

      const populatedReview = await Review.findById(newReview._id).populate("customer", "fullName profilePicture");

      return successResponse(res, populatedReview, "Tạo đánh giá thành công. Đánh giá đang chờ duyệt", 201);
    } catch (error) {
      console.error("Create review error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Cập nhật đánh giá
  updateReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      console.log("Update review - ID:", id);
      console.log("Update review - Body:", { rating, comment });
      console.log("Update review - User ID:", req.userId);

      const review = await Review.findById(id);
      if (!review) {
        return errorResponse(res, "Không tìm thấy đánh giá", 404);
      }

      console.log("Review customer:", review.customer.toString());

      // Kiểm tra quyền sở hữu
      if (review.customer.toString() !== req.userId) {
        return errorResponse(res, "Bạn không có quyền cập nhật đánh giá này", 403);
      }

      if (rating) {
        if (rating < 1 || rating > 5) {
          return errorResponse(res, "Rating phải từ 1 đến 5", 400);
        }
        review.rating = rating;
      }

      if (comment !== undefined) {
        review.comment = comment;
      }

      // Reset status về Chờ duyệt khi update
      review.status = "Chờ duyệt";
      await review.save();

      return successResponse(res, review, "Cập nhật đánh giá thành công");
    } catch (error) {
      console.error("Update review error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Xóa đánh giá (Customer)
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Delete review - ID:", id);
      console.log("Delete review - User ID:", req.userId);

      const review = await Review.findById(id);
      if (!review) {
        return errorResponse(res, "Không tìm thấy đánh giá", 404);
      }

      console.log("Review customer:", review.customer.toString());

      // Kiểm tra quyền sở hữu
      if (review.customer.toString() !== req.userId) {
        return errorResponse(res, "Bạn không có quyền xóa đánh giá này", 403);
      }

      // await Review.findByIdAndDelete(id);
      review.isDeleted = true;
      await review.save();

      return successResponse(res, {}, "Xóa đánh giá thành công");
    } catch (error) {
      console.error("Delete review error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy tất cả đánh giá (Admin)
  getAllReviews: async (req, res) => {
    try {
      const { status, rating, page = 1, limit = 20 } = req.query;
      
      const query = {
        ...getDeleteFilter(req.query)
      };
      if (status) {
        query.status = status;
      }
      if (rating !== undefined) {
        const parsed = parseInt(rating, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 5) {
          return errorResponse(res, "Rating filter phải là số từ 1 đến 5", 400);
        }
        query.rating = parsed;
      }

      const skip = (page - 1) * limit;
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate("customer", "fullName email")
          .populate("movie", "title")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Review.countDocuments(query),
      ]);

      return successResponse(res, {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get all reviews error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Duyệt đánh giá (Admin)
  approveReview: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findById(id);
      if (!review) {
        return errorResponse(res, "Không tìm thấy đánh giá", 404);
      }

      review.status = "Đã duyệt";
      review.approvedBy = req.userId;
      await review.save();

      return successResponse(res, review, "Duyệt đánh giá thành công");
    } catch (error) {
      console.error("Approve review error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Từ chối đánh giá (Admin)
  rejectReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const review = await Review.findById(id);
      if (!review) {
        return errorResponse(res, "Không tìm thấy đánh giá", 404);
      }

      review.status = "Bị từ chối";
      review.approvedBy = req.userId;
      await review.save();

      return successResponse(res, { review, reason }, "Từ chối đánh giá thành công");
    } catch (error) {
      console.error("Reject review error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Xóa đánh giá (Admin)
  deleteReviewByAdmin: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findById(id);
      if (!review) {
        return errorResponse(res, "Không tìm thấy đánh giá", 404);
      }
      
      review.isDeleted = true;
      await review.save();
      
      return successResponse(res, {}, "Xóa đánh giá thành công");
    } catch (error) {
      console.error("Delete review by admin error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default reviewController;
