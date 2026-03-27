import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
// import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { specs, swaggerUi } from "./config/swagger.js";
import routes from "./routes/index.js";
import redisService from "./services/redis.service.js";
import websocketService from "./services/websocket.service.js";
// import { successResponse, errorResponse } from "./utils/response.js";
import { errorHandler, notFoundHandler } from "./utils/errors.js";

const app = express();

// ------MIDDLEWARE-------

// Bảo mật
app.use(helmet());

// CORS
app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "https://movie-booking-cinema.vercel.app" // Thêm chính xác link này vào
      ],
      methods: ["GET", "POST", "PUT", "DELETE"], // Mở thêm các phương thức cho chắc
      credentials: true,
    })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // Use cookie-parser

// Ghi log
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// // Giới hạn tỷ lệ request
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: "Quá nhiều request từ IP này, vui lòng thử lại sau",
// });
// app.use("/api/", limiter);

// // Giới hạn tỷ lệ chặt chẽ hơn cho các endpoint xác thực
// // Trong development: 100 requests/15 phút, Production: 5 requests/15 phút
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: process.env.NODE_ENV === "production" ? 5 : 100,
//   message: "Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút",
// });
// app.use("/api/auth/login", authLimiter);
// app.use("/api/auth/register", authLimiter);

// ------SWAGGER DOCUMENTATION------

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// -------ROUTES--------

// Health check
app.get("/health", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  const redisStatus = redisService.isConnected ? "Connected" : "Disconnected";
  const websocketStatus = websocketService.io ? "Active" : "Inactive";

  const allServicesHealthy =
    mongoStatus === "Connected" && (process.env.REDIS_ENABLED === "false" || redisStatus === "Connected");

  res.status(allServicesHealthy ? 200 : 503).json({
    status: allServicesHealthy ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoStatus,
      redis: process.env.REDIS_ENABLED === "false" ? "Disabled" : redisStatus,
      websocket: process.env.WEBSOCKET_ENABLED === "false" ? "Disabled" : websocketStatus,
    },
  });
});

// Các routes API
app.use("/api", routes);

// ------ERROR HANDLING---------

// Xử lý lỗi 404
app.use(notFoundHandler);

// Trình xử lý lỗi toàn cục
app.use(errorHandler);

export default app;
