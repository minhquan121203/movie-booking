import http from "http";
import mongoose from "mongoose";

import app from "./app.js";
import connectDB from "./config/db.js";

// Import các dịch vụ
import paymentStatusService from "./services/payment-status.service.js";
import redisService from "./services/redis.service.js";
import websocketService from "./services/websocket.service.js";
//  FIX #4 HIGH: Removed duplicate cleanup.service.js, only use expired-holds-cleanup.service.js
import dataSyncService from "./services/data-sync.service.js";
import expiredHoldsCleanupService from "./services/expired-holds-cleanup.service.js";

async function startServer() {
  try {
    // Validate critical environment variables
    const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      console.error(" Missing required environment variables:", missingEnvVars.join(", "));
      console.error(" Please check your .env file and ensure all required variables are set");
      process.exit(1);
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET.length < 32) {
      console.error(" JWT_SECRET must be at least 32 characters long for security");
      process.exit(1);
    }

    console.log(" Environment variables validated");

    // Kết nối đến cơ sở dữ liệu
    await connectDB();

    // Kết nối Redis nếu được bật
    if (process.env.REDIS_ENABLED !== "false") {
      console.log("🔄 Connecting to Redis...");
      try {
        await redisService.connect();
        console.log(" Redis connected successfully");
      } catch (error) {
        console.warn("  Redis connection failed, continuing without Redis:", error.message);
        console.warn(" Set REDIS_ENABLED=false to disable Redis completely");
      }
    } else {
      console.log("  Redis is disabled");
    }

    const server = http.createServer(app);

    // Khởi tạo WebSocket nếu được bật
    if (process.env.WEBSOCKET_ENABLED !== "false") {
      websocketService.initialize(server);
    }

    // Khởi tạo payment status polling
    if (process.env.PAYMENT_POLLING_ENABLED !== "false") {
      paymentStatusService.startPolling();
    }

    //  FIX #4 HIGH: Chỉ dùng 1 cleanup service duy nhất
    // Khởi tạo expired holds cleanup service (handles all cleanup tasks)
    if (process.env.CLEANUP_ENABLED !== "false") {
      expiredHoldsCleanupService.start();
      console.log(" Cleanup service started (expired holds, bookings, vouchers, products)");
    }

    // Khởi tạo data sync service
    if (process.env.DATA_SYNC_ENABLED !== "false") {
      dataSyncService.start();
    }

    // START SERVER
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
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
