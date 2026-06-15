import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    const Movie = mongoose.connection.collection("movies");
    const movies = await Movie.find({ title: /火遮眼/i }).toArray();
    console.log(movies.map(m => ({ title: m.title, trailerUrl: m.trailerUrl, isDeleted: m.isDeleted })));
    
    // Tìm thử tất cả phim có trailer rỗng hoặc sai format
    const badTrailers = await Movie.find({ 
      isDeleted: { $ne: true },
      trailerUrl: { $not: /youtube\.com\/embed/i }
    }).toArray();
    
    console.log("Phim có trailer không phải embed YouTube hợp lệ:", badTrailers.map(m => ({ title: m.title, trailerUrl: m.trailerUrl })));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
