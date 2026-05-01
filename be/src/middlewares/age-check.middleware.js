import Schedule from "../models/schedule.model.js";
import { errorResponse } from "../utils/response.js";

const RATING_AGE_MAP = {
    "P": 0,
    "T13": 13, "C13": 13,
    "T16": 16, "C16": 16,
    "T18": 18, "C18": 18
};

export const checkAge = async (req, res, next) => {
    try {
        return next();
    } catch (error) {
        console.error("Check age middleware error:", error);
        return errorResponse(res, "Lỗi server", 500);
    }
};