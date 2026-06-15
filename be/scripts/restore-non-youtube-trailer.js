/**
 * Script khôi phục phim bị xóa nhầm (có poster + có trailer nhưng trailer không phải YouTube)
 * và chỉ giữ soft-delete phim thật sự không có poster
 * 
 * Chạy: node scripts/restore-non-youtube-trailer.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function restore() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB");

    const Movie = mongoose.connection.collection("movies");

    // Tìm phim bị xóa nhầm: có poster thật + có trailerUrl (bất kỳ link nào)
    const restoreFilter = {
      isDeleted: true,
      posterUrl: { $exists: true, $ne: null, $ne: "" },
      trailerUrl: { $exists: true, $ne: null, $ne: "" },
    };

    // Loại trừ phim có poster là placeholder
    const restoreFilterFull = {
      ...restoreFilter,
      posterUrl: { $not: { $regex: /placeholder/i }, $exists: true, $ne: null, $ne: "" },
    };

    const moviesToRestore = await Movie.find(restoreFilterFull, { title: 1, posterUrl: 1, trailerUrl: 1 }).toArray();

    console.log(`\n🔄 Phim cần khôi phục (có poster + có trailer): ${moviesToRestore.length} phim`);
    moviesToRestore.forEach((m) => console.log(`  ✅ "${m.title}" → trailer: ${m.trailerUrl}`));

    if (moviesToRestore.length > 0) {
      const ids = moviesToRestore.map(m => m._id);
      const result = await Movie.updateMany(
        { _id: { $in: ids } },
        { $set: { isDeleted: false } }
      );
      console.log(`\n✅ Đã khôi phục ${result.modifiedCount} phim`);
    } else {
      console.log("\n📝 Không có phim nào cần khôi phục.");
    }

    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  }
}

restore();
