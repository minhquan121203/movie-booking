import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import Genre from "../models/genre.model.js";
import Movie from "../models/movie.model.js";
import Product from "../models/product.model.js";
import Schedule from "../models/schedule.model.js";
import Theater from "../models/theater.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";

const seedData = async () => {
  try {
    await connectDB();
    console.log("🔄 Starting seed data...");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Genre.deleteMany({});
    await Theater.deleteMany({});
    await Movie.deleteMany({});
    await Product.deleteMany({});
    await Voucher.deleteMany({});
    await Schedule.deleteMany({});

    // 1. Create Admin User
    console.log("👤 Creating admin user...");
    const adminUser = await User.findOne({ email: "admin@cinema.com" });
    if (!adminUser) {
      await User.create({
        email: "admin@cinema.com",
        password: "admin123",
        fullName: "Admin User",
        role: "admin",
        authProvider: "local",
      });
      console.log(" Admin created: admin@cinema.com / admin123");
    }

    // 2. Create Genres
    console.log("🎭 Creating genres...");
    const genres = await Genre.insertMany([
      { name: "Hành động", slug: "hanh-dong", description: "Phim hành động gay cấn" },
      { name: "Hài", slug: "hai", description: "Phim hài hước vui nhộn" },
      { name: "Kinh dị", slug: "kinh-di", description: "Phim kinh dị rùng rợn" },
      { name: "Tình cảm", slug: "tinh-cam", description: "Phim tình cảm lãng mạn" },
      { name: "Khoa học viễn tưởng", slug: "khoa-hoc-vien-tuong", description: "Phim sci-fi" },
      { name: "Hoạt hình", slug: "hoat-hinh", description: "Phim hoạt hình cho mọi lứa tuổi" },
    ]);
    console.log(` Created ${genres.length} genres`);

    // 3. Create Theaters
    console.log("🏢 Creating theaters...");
    const theater1 = await Theater.create({
      name: "CGV Vincom Center",
      slug: "cgv-vincom-center",
      address: "191 Bà Triệu, Hai Bà Trưng, Hà Nội",
      city: "Hà Nội",
      phoneNumber: "1900601700",
      location: {
        type: "Point",
        coordinates: [105.8342, 21.0278],
      },
      rooms: [
        {
          roomName: "Phòng 1",
          roomType: "2D",
          totalSeats: 100,
          rows: 10,
          seatsPerRow: 10,
          seatMap: generateSeats(10, 10),
        },
        {
          roomName: "Phòng 2",
          roomType: "3D",
          totalSeats: 80,
          rows: 8,
          seatsPerRow: 10,
          seatMap: generateSeats(8, 10),
        },
      ],
    });

    const theater2 = await Theater.create({
      name: "Lotte Cinema Landmark",
      slug: "lotte-cinema-landmark",
      address: "Keangnam Landmark 72, Phạm Hùng, Cầu Giấy, Hà Nội",
      city: "Hà Nội",
      phoneNumber: "1900652000",
      location: {
        type: "Point",
        coordinates: [105.7809, 21.0285],
      },
      rooms: [
        {
          roomName: "Phòng 1",
          roomType: "IMAX",
          totalSeats: 120,
          rows: 12,
          seatsPerRow: 10,
          seatMap: generateSeats(12, 10),
        },
      ],
    });

    const theaters = [theater1, theater2];
    console.log(` Created ${theaters.length} theaters`);

    // 4. Create Movies
    console.log("🎬 Creating movies...");
    const movies = await Movie.insertMany([
      {
        title: "Avengers: Endgame",
        slug: "avengers-endgame",
        description:
          "Sau sự kiện tàn khốc của Infinity War, các Avengers tập hợp lần cuối để đảo ngược những gì Thanos đã làm.",
        duration: 181,
        releaseDate: new Date("2024-04-26"),
        director: "Anthony Russo, Joe Russo",
        actors: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson"],
        genres: [genres[0]._id, genres[4]._id],
        language: "English",
        subtitles: ["Vietnamese"],
        rating: "C13",
        posterUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
        status: "Đang chiếu",
      },
      {
        title: "Parasite",
        slug: "parasite",
        description: "Câu chuyện về hai gia đình ở hai tầng lớp xã hội khác nhau.",
        duration: 132,
        releaseDate: new Date("2024-05-01"),
        director: "Bong Joon-ho",
        actors: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"],
        genres: [genres[1]._id, genres[3]._id],
        language: "English",
        subtitles: ["Vietnamese"],
        rating: "C16",
        posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=5xH0HfJHsaY",
        status: "Đang chiếu",
      },
      {
        title: "The Conjuring 3",
        slug: "the-conjuring-3",
        description: "Ed và Lorraine Warren điều tra một vụ án giết người kinh hoàng.",
        duration: 112,
        releaseDate: new Date("2024-12-01"),
        director: "Michael Chaves",
        actors: ["Patrick Wilson", "Vera Farmiga"],
        genres: [genres[2]._id],
        language: "English",
        subtitles: ["Vietnamese"],
        rating: "C18",
        posterUrl: "https://image.tmdb.org/t/p/w500/xbSuFiJbbBWCkyCCKIMfuDCA4yV.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=h9Q4zZS2v1k",
        status: "Sắp chiếu",
      },
    ]);
    console.log(` Created ${movies.length} movies`);

    // 5. Create Schedules (Skip - too complex, create via Swagger UI)
    console.log("⏭️  Skipping schedules (create via Swagger UI)");
    const schedules = [];
    /*
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + i);

      // Movie 1 - Theater 1 - Room 1
      schedules.push({
        movie: movies[0]._id,
        theater: theaters[0]._id,
        room: theaters[0].rooms[0]._id,
        showTime: new Date(showDate.setHours(10, 0, 0)),
        endTime: new Date(showDate.setHours(13, 1, 0)),
        price: 80000,
        availableSeats: 100,
        status: "available",
      });

      schedules.push({
        movie: movies[0]._id,
        theater: theaters[0]._id,
        room: theaters[0].rooms[0]._id,
        showTime: new Date(showDate.setHours(14, 0, 0)),
        endTime: new Date(showDate.setHours(17, 1, 0)),
        price: 90000,
        availableSeats: 100,
        status: "available",
      });

      // Movie 2 - Theater 1 - Room 2
      schedules.push({
        movie: movies[1]._id,
        theater: theaters[0]._id,
        room: theaters[0].rooms[1]._id,
        showTime: new Date(showDate.setHours(19, 0, 0)),
        endTime: new Date(showDate.setHours(21, 12, 0)),
        price: 120000,
        availableSeats: 80,
        status: "available",
      });
    }

    // await Schedule.insertMany(schedules);
    // console.log(` Created ${schedules.length} schedules`);
    */

    // 6. Create Products
    console.log("🍿 Creating products...");
    const products = await Product.insertMany([
      {
        name: "Bắp rang bơ (L)",
        slug: "bap-rang-bo-l",
        description: "Bắp rang bơ size lớn",
        price: 60000,
        category: "Popcorn",
        stock: 100,
        imageUrl: "https://via.placeholder.com/300x300?text=Popcorn",
      },
      {
        name: "Coca Cola (L)",
        slug: "coca-cola-l",
        description: "Nước ngọt Coca Cola size lớn",
        price: 40000,
        category: "Drink",
        stock: 150,
        imageUrl: "https://via.placeholder.com/300x300?text=Coca",
      },
      {
        name: "Combo 1 (Bắp + Nước)",
        slug: "combo-1",
        description: "1 Bắp rang bơ + 1 Nước ngọt",
        price: 85000,
        category: "Combo",
        stock: 80,
        imageUrl: "https://via.placeholder.com/300x300?text=Combo",
      },
    ]);
    console.log(` Created ${products.length} products`);

    // 7. Create Vouchers
    console.log("🎟️  Creating vouchers...");
    const vouchers = await Voucher.insertMany([
      {
        code: "WELCOME20",
        description: "Giảm 20% cho khách hàng mới",
        discountType: "percent",
        discountValue: 20,
        minOrderValue: 100000,
        maxDiscountAmount: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUsagePerUser: 1,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
      },
      {
        code: "FREESHIP",
        description: "Miễn phí giao hàng",
        discountType: "fixed",
        discountValue: 30000,
        minOrderValue: 200000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        maxUsagePerUser: 3,
        usageLimit: 50,
        usedCount: 0,
        isActive: true,
      },
    ]);
    console.log(` Created ${vouchers.length} vouchers`);

    console.log("\n🎉 Seed data completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Genres: ${genres.length}`);
    console.log(`   - Theaters: ${theaters.length}`);
    console.log(`   - Movies: ${movies.length}`);
    console.log(`   - Schedules: 0 (create via Swagger UI)`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Vouchers: ${vouchers.length}`);
    console.log("\n🔑 Admin credentials:");
    console.log("   Email: admin@cinema.com");
    console.log("   Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error(" Seed data error:", error);
    process.exit(1);
  }
};

// Helper function to generate seats
function generateSeats(rows, seatsPerRow) {
  const seats = [];
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < rows; i++) {
    for (let j = 1; j <= seatsPerRow; j++) {
      seats.push({
        seatNumber: `${rowLetters[i]}${j}`,
        seatType: j <= 2 || j >= seatsPerRow - 1 ? "VIP" : "Thường",
        isAvailable: true,
        row: rowLetters[i],
        column: j,
      });
    }
  }

  return seats;
}

seedData();
