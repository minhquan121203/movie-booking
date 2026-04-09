import mongoose from "mongoose";
import { normalizeYoutubeTrailerUrl } from "../helpers/normalizeYoutubeTrailerUrl.js";
import Genre from "../models/genre.model.js";
import Movie from "../models/movie.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

const movieController = {
  // Lấy danh sách phim (có phân trang, filter, search)
  getAllMovies: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        status,
        genre,
        search,
        genres,
        country,
        rating, // P, C13, C16, C18
        language,
        subtitle,
        fromYear,
        toYear,
        year,
        minDuration,
        maxDuration,
        minAge,
        maxAge,
        minAverageRating,
        maxAverageRating,
        minViewCount,
        maxViewCount,
        // sort
        sortBy = "releaseDate",
        order = "desc",
      } = req.query;

      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 12;
      const query = {
        ...getDeleteFilter(req.query),
      };

      if (status) {
        const statuses = Array.isArray(status)
            ? status
            : status
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

        if (statuses.length === 1) {
          query.status = statuses[0];
        }
        else if (statuses.length > 1) {
          query.status = { $in: statuses };
        }
      }

      const genreTokens = [];

      // param "genre" đơn
      if (genre) {
        if (Array.isArray(genre)) {
          genreTokens.push(...genre);
        } else {
          genre
            .toString()
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
            .forEach((g) => genreTokens.push(g));
        }
      }

      // param "genres" nhiều
      if (genres) {
        if (Array.isArray(genres)) {
          genreTokens.push(...genres);
        } else {
          genres
            .toString()
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
            .forEach((g) => genreTokens.push(g));
        }
      }

      if (genreTokens.length > 0) {
        const idTokens = [];
        const nameTokens = [];

        genreTokens.forEach((g) => {
          if (mongoose.Types.ObjectId.isValid(g)) {
            idTokens.push(g);
          } else {
            nameTokens.push(g);
          }
        });

        // Nếu có tên → tìm Genre theo name
        if (nameTokens.length > 0) {
          const genreDocs = await Genre.find({ name: { $in: nameTokens } }, "_id").lean();

          genreDocs.forEach((g) => idTokens.push(g._id.toString()));
        }

        // Nếu sau khi xử lý có id hợp lệ thì mới set query.genres
        if (idTokens.length > 0) {
          query.genres = { $in: idTokens };
        } else {
          // Không tìm được thể loại nào khớp -> trả về rỗng luôn
          return successResponse(res, {
            movies: [],
            pagination: {
              currentPage: pageNumber,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limitNumber,
            },
          });
        }
      }

      if (country) {
        // có thể truyền: "Mỹ" hoặc "Mỹ,Hàn Quốc"
        const countries = Array.isArray(country)
          ? country
          : country
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean);
        if (countries.length) {
          query.country = { $in: countries };
        }
      }

      if (rating) {
        // P,C13,C16,C18 hoặc 1 giá trị
        const ratings = Array.isArray(rating)
          ? rating
          : rating
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean);
        if (ratings.length === 1) {
          query.rating = ratings[0];
        } else if (ratings.length > 1) {
          query.rating = { $in: ratings };
        }
      }

      if (language) {
        query.language = language;
      }

      if (subtitle) {
        // subtitles là array
        query.subtitles = { $in: [subtitle] };
      }

      // Thời lượng (phút)
      if (minDuration || maxDuration) {
        query.duration = {};
        if (minDuration) query.duration.$gte = Number(minDuration);
        if (maxDuration) query.duration.$lte = Number(maxDuration);
      }

      // Giới hạn tuổi
      if (minAge || maxAge) {
        query.ageRestriction = {};
        if (minAge) query.ageRestriction.$gte = Number(minAge);
        if (maxAge) query.ageRestriction.$lte = Number(maxAge);
      }

      // Năm phát hành từ releaseDate
      const fromYearNum = fromYear ? parseInt(fromYear, 10) : null;
      const toYearNum = toYear ? parseInt(toYear, 10) : null;
      const yearNum = year ? parseInt(year, 10) : null;

      if (yearNum) {
        const start = new Date(yearNum, 0, 1);
        const end = new Date(yearNum + 1, 0, 1);
        query.releaseDate = { $gte: start, $lt: end };
      } else if (fromYearNum || toYearNum) {
        query.releaseDate = {};
        if (fromYearNum) query.releaseDate.$gte = new Date(fromYearNum, 0, 1);
        if (toYearNum) query.releaseDate.$lt = new Date(toYearNum + 1, 0, 1);
      }

      // averageRating
      if (minAverageRating || maxAverageRating) {
        query.averageRating = {};
        if (minAverageRating) query.averageRating.$gte = Number(minAverageRating);
        if (maxAverageRating) query.averageRating.$lte = Number(maxAverageRating);
      }

      // viewCount
      if (minViewCount || maxViewCount) {
        query.viewCount = {};
        if (minViewCount) query.viewCount.$gte = Number(minViewCount);
        if (maxViewCount) query.viewCount.$lte = Number(maxViewCount);
      }

      // Tìm kiếm full-text đơn giản
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { director: { $regex: search, $options: "i" } },
          { actors: { $regex: search, $options: "i" } },
        ];
      }

      // ===== Sort =====
      const allowedSortFields = [
        "releaseDate",
        "createdAt",
        "updatedAt",
        "averageRating",
        "totalReviews",
        "viewCount",
        "title",
        "duration",
        "totalRevenue",
      ];

      const sortField = allowedSortFields.includes(sortBy) ? sortBy : "releaseDate";
      const sort = { [sortField]: order === "asc" ? 1 : -1 };

      // ===== Execute =====
      const skip = (pageNumber - 1) * limitNumber;

      const [movies, total] = await Promise.all([
        Movie.find(query).populate("genres", "name").sort(sort).skip(skip).limit(limitNumber).lean(),
        Movie.countDocuments(query),
      ]);

      return successResponse(res, {
        movies,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalItems: total,
          itemsPerPage: limitNumber,
        },
      });
    } catch (error) {
      console.error("Get all movies error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy chi tiết một phim
  getMovieById: async (req, res) => {
    try {
      const { id } = req.params;

      const movie = await Movie.findById(id)
        .populate("genres", "name description")
        .populate("createdBy", "fullName email")
        .populate("updatedBy", "fullName email")
        .lean();

      if (!movie) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }

      return successResponse(res, movie);
    } catch (error) {
      console.error("Get movie by id error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Tạo phim mới (Admin)
  createMovie: async (req, res) => {
    try {
      console.log("Create movie - Body:", req.body);
      const movieData = req.body;
      movieData.createdBy = req.userId;

      // Fix Swagger array issue - convert object to array if needed
      if (movieData.actors && typeof movieData.actors === "object" && !Array.isArray(movieData.actors)) {
        movieData.actors = Object.values(movieData.actors);
      }
      if (movieData.genres && typeof movieData.genres === "object" && !Array.isArray(movieData.genres)) {
        movieData.genres = Object.values(movieData.genres);
      }
      if (movieData.subtitles && typeof movieData.subtitles === "object" && !Array.isArray(movieData.subtitles)) {
        movieData.subtitles = Object.values(movieData.subtitles);
      }
      if (movieData.metaKeywords && typeof movieData.metaKeywords === "object" && !Array.isArray(movieData.metaKeywords)) {
        movieData.metaKeywords = Object.values(movieData.metaKeywords);
      }
      // Handle case where metaKeywords might be stringified JSON or weird format from Swagger
      if (movieData.metaKeywords) {
          if (typeof movieData.metaKeywords === "string") {
              try {
                  const parsed = JSON.parse(movieData.metaKeywords);
                  if (Array.isArray(parsed)) movieData.metaKeywords = parsed;
                  else movieData.metaKeywords = [movieData.metaKeywords];
              } catch (e) {
                  movieData.metaKeywords = [movieData.metaKeywords];
              }
          }
          if (Array.isArray(movieData.metaKeywords)) {
              // Filter out objects or meaningless strings
              movieData.metaKeywords = movieData.metaKeywords
                  .filter(k => typeof k === 'string' && k.trim() !== '' && k !== '[{}]' && k !== '{}');
          }
      }

      if (movieData.trailerUrl) {
        movieData.trailerUrl = normalizeYoutubeTrailerUrl(movieData.trailerUrl);
      }

      // Validate genres
      if (movieData.genres && movieData.genres.length > 0) {
        console.log("Validating genres:", movieData.genres);
        const validGenres = await Genre.find({
          _id: { $in: movieData.genres },
        });
        console.log("Valid genres found:", validGenres.length);

        if (validGenres.length !== movieData.genres.length) {
          return errorResponse(res, "Một số thể loại không tồn tại", 400);
        }
      }

      console.log("Creating movie with data:", movieData);
      const newMovie = new Movie(movieData);
      await newMovie.save();

      const populatedMovie = await Movie.findById(newMovie._id).populate("genres", "name");

      return successResponse(res, populatedMovie, "Tạo phim thành công", 201);
    } catch (error) {
      console.error("Create movie error:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  // Cập nhật phim (Admin)
  updateMovie: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updatedBy = req.userId;

      console.log("Update movie - ID:", id);
      console.log("Update movie - Body:", updateData);

      // Fix Swagger array issue - convert object to array if needed
      if (updateData.actors && typeof updateData.actors === "object" && !Array.isArray(updateData.actors)) {
        updateData.actors = Object.values(updateData.actors);
      }
      if (updateData.genres && typeof updateData.genres === "object" && !Array.isArray(updateData.genres)) {
        updateData.genres = Object.values(updateData.genres);
      }
      if (updateData.subtitles && typeof updateData.subtitles === "object" && !Array.isArray(updateData.subtitles)) {
        updateData.subtitles = Object.values(updateData.subtitles);
      }
      if (updateData.metaKeywords && typeof updateData.metaKeywords === "object" && !Array.isArray(updateData.metaKeywords)) {
        updateData.metaKeywords = Object.values(updateData.metaKeywords);
      }
      // Handle case where metaKeywords might be stringified JSON or weird format from Swagger
      if (updateData.metaKeywords) {
          if (typeof updateData.metaKeywords === "string") {
              try {
                  const parsed = JSON.parse(updateData.metaKeywords);
                  if (Array.isArray(parsed)) updateData.metaKeywords = parsed;
                  else updateData.metaKeywords = [updateData.metaKeywords];
              } catch (e) {
                  updateData.metaKeywords = [updateData.metaKeywords];
              }
          }
          if (Array.isArray(updateData.metaKeywords)) {
              // Filter out objects or meaningless strings
              updateData.metaKeywords = updateData.metaKeywords
                  .filter(k => typeof k === 'string' && k.trim() !== '' && k !== '[{}]' && k !== '{}');
          }
      }

      // Extract genre IDs if genres are objects
      if (updateData.genres && Array.isArray(updateData.genres) && updateData.genres.length > 0) {
        if (typeof updateData.genres[0] === "object" && updateData.genres[0]._id) {
          updateData.genres = updateData.genres.map((g) => g._id);
          console.log("Extracted genre IDs:", updateData.genres);
        }
      }

      // Extract actor names if actors are objects
      if (updateData.actors && Array.isArray(updateData.actors) && updateData.actors.length > 0) {
        if (typeof updateData.actors[0] === "object" && updateData.actors[0].name) {
          updateData.actors = updateData.actors.map((a) => a.name);
        }
      }

      if (updateData.trailerUrl) {
        updateData.trailerUrl = normalizeYoutubeTrailerUrl(updateData.trailerUrl);
      }

      // Validate genres nếu có
      if (updateData.genres && updateData.genres.length > 0) {
        const validGenres = await Genre.find({
          _id: { $in: updateData.genres },
        });

        if (validGenres.length !== updateData.genres.length) {
          return errorResponse(res, "Một số thể loại không tồn tại", 400);
        }
      }

      const updatedMovie = await Movie.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(
        "genres",
        "name"
      );

      if (!updatedMovie) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }

      return successResponse(res, updatedMovie, "Cập nhật phim thành công");
    } catch (error) {
      console.error("Update movie error:", error);
      console.error("Error message:", error.message);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  // Xóa phim (Admin)
  deleteMovie: async (req, res) => {
    try {
      const { id } = req.params;

      const movie = await Movie.findById(id);
      if (!movie) {
        return errorResponse(res, "Không tìm thấy phim", 404);
      }

      //  FIX: Kiểm tra xem phim có lịch chiếu trong tương lai không
      const Schedule = (await import("../models/schedule.model.js")).default;
      const now = new Date();
      const futureSchedules = await Schedule.countDocuments({
        movie: id,
        showDate: { $gte: now },
        status: { $ne: "Đã hủy" },
      });

      if (futureSchedules > 0) {
        return errorResponse(
          res,
          `Không thể xóa phim. Phim còn ${futureSchedules} suất chiếu trong tương lai. Vui lòng hủy tất cả lịch chiếu trước khi xóa phim.`,
          400
        );
      }

      //  FIX: Soft delete thay vì hard delete để giữ lại dữ liệu lịch sử
      movie.isDeleted = true;
      movie.status = "Ngừng chiếu";
      movie.updatedBy = req.userId;
      await movie.save();

      // Xóa cache
      const redisService = (await import("../services/redis.service.js")).default;
      redisService.invalidateMovieCache(id.toString()).catch(() => {});

      return successResponse(res, {}, "Xóa phim thành công");
    } catch (error) {
      console.error("Delete movie error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy phim đang chiếu
  getNowShowingMovies: async (req, res) => {
    try {
      const { page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * limit;

      const [movies, total] = await Promise.all([
        Movie.find({ status: "Đang chiếu", ...getDeleteFilter(req.query) })
          .populate("genres", "name")
          .sort({ releaseDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Movie.countDocuments({ status: "Đang chiếu", ...getDeleteFilter(req.query) }),
      ]);

      return successResponse(res, {
        movies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get now showing movies error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy phim sắp chiếu
  getUpcomingMovies: async (req, res) => {
    try {
      const { page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * limit;

      const [movies, total] = await Promise.all([
        Movie.find({ status: "Sắp chiếu", ...getDeleteFilter(req.query) })
          .populate("genres", "name")
          .sort({ releaseDate: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Movie.countDocuments({ status: "Sắp chiếu", ...getDeleteFilter(req.query) }),
      ]);

      return successResponse(res, {
        movies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get upcoming movies error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Lấy phim theo thể loại
  getMoviesByGenre: async (req, res) => {
    try {
      const { genreId } = req.params;
      const { page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * limit;

      // Kiểm tra genre tồn tại
      const genre = await Genre.findById(genreId);
      if (!genre) {
        return errorResponse(res, "Không tìm thấy thể loại", 404);
      }

      const [movies, total] = await Promise.all([
        Movie.find({ genres: genreId, ...getDeleteFilter(req.query) })
          .populate("genres", "name")
          .sort({ releaseDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Movie.countDocuments({ genres: genreId, ...getDeleteFilter(req.query) }),
      ]);

      return successResponse(res, {
        genre: genre.name,
        movies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Get movies by genre error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default movieController;
