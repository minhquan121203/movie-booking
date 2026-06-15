/**
 * Script dọn dẹp phim không có poster thật hoặc trailer YouTube
 * Soft-delete (isDeleted: true) các phim "rác" đã bị cào vào DB
 * 
 * Chạy: node scripts/cleanup-bad-movies.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB");

    const Movie = mongoose.connection.collection("movies");

    // 1. Tìm phim có poster là placeholder hoặc không có poster
    const badPosterFilter = {
      isDeleted: { $ne: true },
      $or: [
        { posterUrl: { $exists: false } },
        { posterUrl: null },
        { posterUrl: "" },
        { posterUrl: { $regex: /placeholder/i } },
      ],
    };

    // 2. Tìm phim không có trailer YouTube
    const badTrailerFilter = {
      isDeleted: { $ne: true },
      $or: [
        { trailerUrl: { $exists: false } },
        { trailerUrl: null },
        { trailerUrl: "" },
        {
          trailerUrl: {
            $not: { $regex: /youtube\.com|youtu\.be/i },
          },
        },
      ],
    };

    // Liệt kê phim bị ảnh hưởng
    const badPosterMovies = await Movie.find(badPosterFilter, { title: 1, posterUrl: 1 }).toArray();
    const badTrailerMovies = await Movie.find(badTrailerFilter, { title: 1, trailerUrl: 1 }).toArray();

    console.log(`\n🖼️ Phim KHÔNG có poster thật (${badPosterMovies.length} phim):`);
    badPosterMovies.forEach((m) => console.log(`  ❌ "${m.title}" → poster: ${m.posterUrl || "(trống)"}`));

    console.log(`\n🎬 Phim KHÔNG có trailer YouTube (${badTrailerMovies.length} phim):`);
    badTrailerMovies.forEach((m) => console.log(`  ❌ "${m.title}" → trailer: ${m.trailerUrl || "(trống)"}`));

    // Gộp 2 filter lại và soft-delete
    const combinedFilter = {
      isDeleted: { $ne: true },
      $or: [
        // Không có poster thật
        { posterUrl: { $exists: false } },
        { posterUrl: null },
        { posterUrl: "" },
        { posterUrl: { $regex: /placeholder/i } },
        // Không có trailer YouTube
        { trailerUrl: { $exists: false } },
        { trailerUrl: null },
        { trailerUrl: "" },
        {
          trailerUrl: {
            $not: { $regex: /youtube\.com|youtu\.be/i },
          },
        },
      ],
    };

    const result = await Movie.updateMany(combinedFilter, {
      $set: { isDeleted: true },
    });

    console.log(`\n✅ Đã soft-delete ${result.modifiedCount} phim "rác" (không có poster hoặc trailer)`);
    console.log("📝 Những phim này sẽ không hiển thị trên web nữa nhưng dữ liệu vẫn còn trong DB.");

    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  }
}

cleanup();
