import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";

const getIdsForSchedule = async () => {
  try {
    await connectDB();
    console.log("📋 Lấy thông tin để tạo Schedule...\n");

    // Get Movies
    const movies = await Movie.find().select("_id title");
    console.log("🎬 MOVIES:");
    movies.forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title}`);
      console.log(`      ID: ${movie._id}\n`);
    });

    // Get Theaters with Rooms
    const theaters = await Theater.find().select("_id name rooms");
    console.log("🏢 THEATERS & ROOMS:");
    theaters.forEach((theater, tIndex) => {
      console.log(`   ${tIndex + 1}. ${theater.name}`);
      console.log(`      Theater ID: ${theater._id}`);
      theater.rooms.forEach((room, rIndex) => {
        console.log(`      Room ${rIndex + 1}: ${room.roomName}`);
        console.log(`         Room ID: ${room._id}`);
        console.log(`         Type: ${room.roomType}`);
        console.log(`         Total Seats: ${room.totalSeats}`);
      });
      console.log("");
    });

    // Generate example schedule JSON
    if (movies.length > 0 && theaters.length > 0 && theaters[0].rooms.length > 0) {
      const movie = movies[0];
      const theater = theaters[0];
      const room = theater.rooms[0];

      console.log("📝 EXAMPLE SCHEDULE JSON:");
      console.log("Copy và paste vào Swagger UI (POST /admin/schedules):\n");

      const exampleSchedule = {
        movie: movie._id.toString(),
        theater: theater._id.toString(),
        room: room._id.toString(),
        roomName: room.roomName,
        roomType: room.roomType,
        showDate: "2024-11-20",
        startTime: "10:00",
        endTime: "13:00",
        ticketPrices: {
          standard: 80000,
          vip: 120000,
          couple: 150000,
        },
        totalSeats: room.totalSeats,
        language: "English",
        subtitles: ["Vietnamese"],
      };

      console.log(JSON.stringify(exampleSchedule, null, 2));
      console.log("\n");

      // Generate multiple time slots
      console.log("📅 MULTIPLE TIME SLOTS (Copy từng cái để tạo nhiều suất):\n");

      const timeSlots = [
        { start: "10:00", end: "13:00", price: 70000, label: "Suất sáng" },
        { start: "14:00", end: "17:00", price: 90000, label: "Suất chiều" },
        { start: "19:00", end: "22:00", price: 100000, label: "Suất tối" },
      ];

      timeSlots.forEach((slot) => {
        console.log(`// ${slot.label}`);
        const schedule = {
          ...exampleSchedule,
          startTime: slot.start,
          endTime: slot.end,
          ticketPrices: {
            standard: slot.price,
            vip: slot.price + 30000,
            couple: slot.price + 50000,
          },
        };
        console.log(JSON.stringify(schedule, null, 2));
        console.log("\n");
      });
    }

    console.log(" Done! Sử dụng các ID trên để tạo schedule trên Swagger UI");
    console.log("📖 Xem hướng dẫn chi tiết trong file: SCHEDULE_CREATION_GUIDE.md");

    process.exit(0);
  } catch (error) {
    console.error(" Error:", error);
    process.exit(1);
  }
};

getIdsForSchedule();
