import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Theater from "../models/theater.model.js";
import { generateSlug } from "../utils/slug.js";
dotenv.config();

const generateSeats = (rows, perRow, options = {}) => {
  const { coupleRows = [], vipRows = [] } = options;

  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const seats = [];

  for (let r = 0; r < rows; r++) {
    const rowLetter = rowLetters[r];

    for (let c = 1; c <= perRow; c++) {
      let seatType = "Thường";

      if (vipRows.includes(r)) seatType = "VIP";
      if (coupleRows.includes(r)) seatType = "Ghế đôi";

      // GHẾ VIP 2 bên, ghế đôi ở giữa
      if (c <= 2 || c >= perRow - 1) seatType = "VIP";

      seats.push({
        seatNumber: `${rowLetter}${c}`,
        seatType,
        isAvailable: true,
        row: rowLetter,
        column: c,
      });
    }
  }
  return seats;
};

// === Rạp theo từng thành phố (tên thật) ===
const THEATERS_BY_CITY = {
  "Hà Nội": [
    "CGV Vincom Bà Triệu",
    "CGV Times City",
    "CGV Royal City",
    "Lotte Cinema Hà Đông",
    "Lotte Cinema Tây Sơn",
    "Beta Mỹ Đình",
    "Beta Thanh Xuân",
    "Galaxy Nguyễn Du",
    "Cinestar Hai Bà Trưng",
    "BHD Star Discovery",
  ],
  "TP. Hồ Chí Minh": [
    "CGV Hùng Vương Plaza",
    "CGV Crescent Mall",
    "CGV VivoCity",
    "Lotte Cinema Gò Vấp",
    "Lotte Cinema Thủ Đức",
    "Galaxy Tân Bình",
    "Galaxy Kinh Dương Vương",
    "BHD Star Thảo Điền",
    "MegaGS Cao Thắng",
    "Cinestar Quốc Thanh",
  ],
  "Đà Nẵng": [
    "CGV Vincom Đà Nẵng",
    "Lotte Cinema Đà Nẵng",
    "Galaxy Đà Nẵng",
    "BHD Star Đà Nẵng",
    "Metiz Cinema",
    "Starlight Đà Nẵng",
    "Beta Đà Nẵng",
    "Cinestar Đà Nẵng",
    "Tân Sơn Cinema",
    "Sunshine Cinema",
  ],
  "Cần Thơ": [
    "CGV Sense City",
    "Lotte Cinema Cần Thơ",
    "Galaxy Cần Thơ",
    "BHD Star Cần Thơ",
    "Beta Cần Thơ",
    "Cinestar Cần Thơ",
    "Starlight Cần Thơ",
    "Tây Đô Cinema",
    "Vincom Cinema Cần Thơ",
    "MegaGS Cần Thơ",
  ],
};

// === Tọa độ trung tâm mỗi TP ===
const CITY_COORDS = {
  "Hà Nội": [105.8342, 21.0278],
  "TP. Hồ Chí Minh": [106.6602, 10.7626],
  "Đà Nẵng": [108.2208, 16.0678],
  "Cần Thơ": [105.78, 10.0452],
};

const seedTheaters = async () => {
  await connectDB();

  console.log("🗑 Xóa dữ liệu cũ...");
  await Theater.deleteMany();

  const theaters = [];

  for (const city of Object.keys(THEATERS_BY_CITY)) {
    const baseCoords = CITY_COORDS[city];

    THEATERS_BY_CITY[city].forEach((name) => {
      theaters.push({
        name,
        slug: generateSlug(name),
        address: `Trung tâm ${city}`,
        city,
        district: "N/A",
        phoneNumber: "1900123456",
        email: `${generateSlug(name)}@cinema.vn`,
        location: {
          type: "Point",
          coordinates: [baseCoords[0] + (Math.random() * 0.03 - 0.015), baseCoords[1] + (Math.random() * 0.03 - 0.015)],
        },
        amenities: ["Parking", "Restroom", "Food Court", "Wifi"],
        images: [
          {
            url: `https://via.placeholder.com/600x400?text=${encodeURIComponent(name)}`,
            caption: `Hình ảnh rạp ${name}`,
          },
        ],
        openingHours: "08:00 - 23:00",
        rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)),
        totalReviews: Math.floor(Math.random() * 5000),

        // === 4 PHÒNG CHIẾU CHUẨN ===
        rooms: [
          // ⭐ 1. Phòng 2D
          {
            roomName: "Phòng 2D",
            roomType: "2D",
            screenType: "Standard",
            rows: 12,
            seatsPerRow: 10,
            totalSeats: 120,
            seatMap: generateSeats(12, 10),
          },

          // ⭐ 2. Phòng 3D
          {
            roomName: "Phòng 3D",
            roomType: "3D",
            screenType: "Dolby Atmos",
            rows: 8,
            seatsPerRow: 10,
            totalSeats: 80,
            seatMap: generateSeats(8, 10),
          },

          // ⭐ 3. Phòng IMAX (250 ghế)
          {
            roomName: "Phòng IMAX",
            roomType: "IMAX",
            screenType: "IMAX",
            rows: 15,
            seatsPerRow: 16,
            totalSeats: 240,
            seatMap: generateSeats(15, 16, {
              vipRows: [3, 4, 5, 6], // dãy đẹp nhất → VIP
            }),
          },

          // ⭐ 4. Phòng 4DX (60 ghế)
          {
            roomName: "Phòng 4DX",
            roomType: "4DX",
            screenType: "Dolby Atmos",
            rows: 6,
            seatsPerRow: 10,
            totalSeats: 60,
            seatMap: generateSeats(6, 10, {
              coupleRows: [4], // dãy ghế đôi
            }),
          },
        ],
      });
    });
  }

  await Theater.insertMany(theaters);

  console.log(`🎉 IMPORTED ${theaters.length} RẠP VỚI 4 LOẠI PHÒNG (2D, 3D, IMAX, 4DX)`);
  process.exit();
};

seedTheaters();
