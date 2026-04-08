import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";

import app from "./app.js";
import connectDB from "./config/db.js";

// Import các dịch vụ
import paymentStatusService from "./services/payment-status.service.js";
import redisService from "./services/redis.service.js";
import websocketService from "./services/websocket.service.js";
import dataSyncService from "./services/data-sync.service.js";
import expiredHoldsCleanupService from "./services/expired-holds-cleanup.service.js";
import movieStatusService from "./services/movie-status.service.js";

let server;

async function startServer() {
  try {
    const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      console.error("Missing env vars:", missingEnvVars.join(", "));
      process.exit(1);
    }

    await connectDB();

    if (process.env.REDIS_ENABLED !== "false") {
      try { await redisService.connect(); } catch (e) { console.warn("Redis skip"); }
    }

    server = http.createServer(app);
    const PORT = process.env.PORT || 5000;

    // Mở cổng server NGAY LẬP TỨC 🔥
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is officially LIVE on port ${PORT}`);

      if (process.env.WEBSOCKET_ENABLED !== "false") {
        websocketService.initialize(server);
      }

      if (process.env.PAYMENT_POLLING_ENABLED !== "false") {
        paymentStatusService.startPolling();
      }

      if (process.env.CLEANUP_ENABLED !== "false") {
        expiredHoldsCleanupService.start();
        console.log("🧹 Cleanup service started");
      }

      if (process.env.DATA_SYNC_ENABLED !== "false") {
        setTimeout(() => {
          console.log("🎬 Bắt đầu cào phim TMDB...");
          dataSyncService.start();
        }, 5000);
      }

      // Tự động cập nhật trạng thái phim (Sắp chiếu -> Đang chiếu)
      if (typeof movieStatusService !== 'undefined') {
        movieStatusService.start();
      }

      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    return server;
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// GRACEFUL SHUTDOWN
const gracefulShutdown = async (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      // Đóng kết nối cơ sở dữ liệu
      await mongoose.connection.close();
      console.log("MongoDB connection closed");

      // Đóng kết nối Redis
      if (redisService.isConnected) {
        await redisService.disconnect();
        console.log("Redis connection closed");
      }

      console.log("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
