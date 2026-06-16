/**
 * Script tính lại viewCount cho tất cả phim dựa trên số vé thực tế đã bán.
 * 
 * Cách chạy: node scripts/recalculate-viewcount.js
 * 
 * Logic:
 * - Lấy tất cả Booking có status "Hoàn tất" hoặc "Đã sử dụng"
 * - Join qua Schedule để lấy movieId
 * - Đếm tổng số ghế (seats) của mỗi phim
 * - Update viewCount = tổng số ghế đã bán
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function recalculateViewCount() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected!\n");

  const Booking = (await import("../src/models/booking.model.js")).default;
  const Movie = (await import("../src/models/movie.model.js")).default;

  // 1. Aggregate: đếm tổng số ghế bán ra cho mỗi phim từ bookings thành công
  console.log("📊 Đang tính lại viewCount từ dữ liệu booking...\n");

  const movieTicketCounts = await Booking.aggregate([
    {
      // Chỉ lấy booking thành công
      $match: {
        status: { $in: ["Hoàn tất", "Đã sử dụng"] },
      },
    },
    {
      // Join với Schedule để lấy movieId
      $lookup: {
        from: "schedules",
        localField: "schedule",
        foreignField: "_id",
        as: "scheduleInfo",
      },
    },
    { $unwind: "$scheduleInfo" },
    {
      // Nhóm theo movieId, đếm tổng ghế
      $group: {
        _id: "$scheduleInfo.movie",
        totalTickets: { $sum: { $size: "$seats" } },
        totalBookings: { $sum: 1 },
      },
    },
    {
      // Lấy thông tin phim
      $lookup: {
        from: "movies",
        localField: "_id",
        foreignField: "_id",
        as: "movieInfo",
      },
    },
    { $unwind: "$movieInfo" },
    {
      $project: {
        movieId: "$_id",
        title: "$movieInfo.title",
        status: "$movieInfo.status",
        oldViewCount: "$movieInfo.viewCount",
        newViewCount: "$totalTickets",
        totalBookings: 1,
      },
    },
    { $sort: { newViewCount: -1 } },
  ]);

  console.log(`📋 Tìm thấy ${movieTicketCounts.length} phim có vé đã bán:\n`);
  console.log("─".repeat(90));
  console.log(
    "Phim".padEnd(40) +
    "Trạng thái".padEnd(15) +
    "ViewCount cũ".padEnd(15) +
    "ViewCount mới".padEnd(15) +
    "Đơn hàng"
  );
  console.log("─".repeat(90));

  // 2. Update viewCount cho từng phim
  let updatedCount = 0;
  for (const movie of movieTicketCounts) {
    console.log(
      movie.title.substring(0, 38).padEnd(40) +
      movie.status.padEnd(15) +
      String(movie.oldViewCount).padEnd(15) +
      String(movie.newViewCount).padEnd(15) +
      String(movie.totalBookings)
    );

    await Movie.findByIdAndUpdate(movie.movieId, {
      viewCount: movie.newViewCount,
    });
    updatedCount++;
  }

  // 3. Reset viewCount = 0 cho các phim không có booking nào
  const movieIdsWithBookings = movieTicketCounts.map((m) => m.movieId);
  const resetResult = await Movie.updateMany(
    {
      _id: { $nin: movieIdsWithBookings },
      viewCount: { $gt: 0 },
    },
    { viewCount: 0 }
  );

  console.log("─".repeat(90));
  console.log(`\n✅ Đã cập nhật viewCount cho ${updatedCount} phim có vé bán.`);
  console.log(`🔄 Đã reset viewCount về 0 cho ${resetResult.modifiedCount} phim chưa bán vé nào.`);

  // 4. Hiển thị Top 10 phim sau khi cập nhật
  console.log("\n🏆 TOP 10 PHIM SAU KHI CẬP NHẬT:");
  console.log("─".repeat(60));
  const topMovies = await Movie.find({ status: "Đang chiếu", isDeleted: false })
    .sort({ viewCount: -1 })
    .limit(10)
    .select("title viewCount status");

  topMovies.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.title} — ${m.viewCount} vé`);
  });
  console.log("─".repeat(60));

  await mongoose.disconnect();
  console.log("\n🔌 Đã ngắt kết nối MongoDB. Hoàn tất!");
}

recalculateViewCount().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
