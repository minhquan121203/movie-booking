/**
 * Script dọn dẹp phim không có poster thật HOẶC không có trailer
 * Soft-delete (isDeleted: true) các phim "rác"
 * Trailer chấp nhận bất kỳ link nào (YouTube, Netflix, v.v.) - miễn là CÓ
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

    // Tìm phim chưa bị xóa mà thiếu poster HOẶC thiếu trailer
    const combinedFilter = {
      isDeleted: { $ne: true },
      $or: [
        // Không có poster thật
        { posterUrl: { $exists: false } },
        { posterUrl: null },
        { posterUrl: "" },
        { posterUrl: { $regex: /placeholder/i } },
        // Không có trailer (bất kỳ link nào)
        { trailerUrl: { $exists: false } },
        { trailerUrl: null },
        { trailerUrl: "" },
      ],
    };

    // Liệt kê phim bị ảnh hưởng
    const badMovies = await Movie.find(combinedFilter, { title: 1, posterUrl: 1, trailerUrl: 1 }).toArray();

    console.log(`\n🗑️ Tổng phim cần soft-delete: ${badMovies.length} phim\n`);

    const noPoster = badMovies.filter(m => !m.posterUrl || (m.posterUrl && m.posterUrl.includes('placeholder')));
    const noTrailer = badMovies.filter(m => !m.trailerUrl);

    console.log(`🖼️ Không có poster: ${noPoster.length} phim`);
    noPoster.slice(0, 10).forEach((m) => console.log(`  ❌ "${m.title}"`));
    if (noPoster.length > 10) console.log(`  ... và ${noPoster.length - 10} phim khác`);

    console.log(`\n🎬 Không có trailer: ${noTrailer.length} phim`);
    noTrailer.slice(0, 20).forEach((m) => console.log(`  ❌ "${m.title}"`));
    if (noTrailer.length > 20) console.log(`  ... và ${noTrailer.length - 20} phim khác`);

    // Soft-delete
    const result = await Movie.updateMany(combinedFilter, {
      $set: { isDeleted: true },
    });

    console.log(`\n✅ Đã soft-delete ${result.modifiedCount} phim "rác" (không có poster hoặc trailer)`);

    // Thống kê còn lại
    const remaining = await Movie.countDocuments({ isDeleted: { $ne: true } });
    console.log(`📊 Còn lại ${remaining} phim hợp lệ trên web`);

    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  }
}

cleanup();
