import Schedule from "../models/schedule.model.js";
import { errorResponse } from "../utils/response.js";

// Map rating to minimum age
const RATING_AGE_MAP = {
  "P": 0,
  "T13": 13, "C13": 13,
  "T16": 16, "C16": 16,
  "T18": 18, "C18": 18
};

export const checkAge = async (req, res, next) => {
    try {
        const { scheduleId } = req.body;
        
        // Skip check if no scheduleId (maybe other validations handle it, or it's not a booking request)
        if (!scheduleId) {
             return next();
        }

        // Must rely on authenticateToken running before this
        const user = req.user;
        if (!user) {
             return errorResponse(res, "Người dùng không tồn tại (Chưa xác thực)", 401);
        }

        // Just in case authentication happened but user fetch failed there (unlikely given middleware)
        // Check if verified_age_level needs to be re-fetched? No, req.user should be fresh enough.

        const schedule = await Schedule.findById(scheduleId).populate("movie");
        if (!schedule || !schedule.movie) {
             return errorResponse(res, "Suất chiếu hoặc phim không tồn tại", 404);
        }

        const movieRating = schedule.movie.rating; // e.g. "C18"
        const requiredAge = RATING_AGE_MAP[movieRating] || 0;

        // If movie requires verification (age > 0)
        if (requiredAge > 0) {
            if (user.verified_age_level === null || user.verified_age_level === undefined) {
                return errorResponse(res, "Bạn chưa xác minh độ tuổi. Vui lòng xác minh CCCD.", 403);
            }
            
            if (user.verified_age_level < requiredAge) {
                return errorResponse(res, `Bạn không đủ tuổi để xem phim này (Yêu cầu ${requiredAge}+, Tuổi của bạn: ${user.verified_age_level})`, 403);
            }
        }

        next();
    } catch (error) {
        console.error("Check age middleware error:", error);
        return errorResponse(res, "Lỗi server khi kiểm tra độ tuổi", 500);
    }
};
