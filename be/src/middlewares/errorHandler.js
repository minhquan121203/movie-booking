import { errorResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  errorResponse(res, err.message || "Internal Server Error", err.status || 500);
};
