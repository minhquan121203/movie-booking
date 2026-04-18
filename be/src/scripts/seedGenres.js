import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/db.js";
import Genre from "../models/genre.model.js";

const seedGenres = async () => {
  await connectDB();
  console.log("🔍 Checking Genres...");

  const count = await Genre.countDocuments();
  if (count > 0) {
    console.log("⚠️ Genres already exist. Deleting old data...");
    await Genre.deleteMany();
  }

  const genres = [
    "Hành động",
    "Hài",
    "Kinh dị",
    "Tình cảm",
    "Khoa học viễn tưởng",
    "Hoạt hình",
    "Phiêu lưu",
    "Tâm lý",
    "Hình sự",
    "Âm nhạc",
    "Chiến tranh",
    "Gia đình",
    "Viễn tây",
    "Thần thoại",
    "Tài liệu",
  ].map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: `Thể loại phim: ${name}`,
  }));

  await Genre.insertMany(genres);

  console.log(`🎉 Imported ${genres.length} genres`);
  process.exit();
};

seedGenres();
