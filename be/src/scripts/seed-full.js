import 'dotenv/config';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

// Import Models
import User from '../models/user.model.js';
import Movie from '../models/movie.model.js';
import Theater from '../models/theater.model.js';
import Schedule from '../models/schedule.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
import StaffKPI from '../models/staff-kpi.model.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema_db';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const generateSeatMap = (rows = 10, cols = 10) => {
    const seats = [];
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
    for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
            seats.push({
                seatNumber: `${rowLabels[r]}${c}`,
                seatType: r >= 8 ? 'Ghế đôi' : (r >= 5 ? 'VIP' : 'Thường'),
                isAvailable: true,
                row: rowLabels[r],
                column: c
            });
        }
    }
    return seats;
};

const seedData = async () => {
  await connectDB();

  try {
    console.log('🚀 Bắt đầu tạo dữ liệu SIÊU NHẸ (Target: ~300-400 lịch)...');

    // 1. DỌN DẸP DỮ LIỆU CŨ
    await Schedule.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await StaffKPI.deleteMany({});
    console.log('🗑️ Đã dọn dẹp dữ liệu cũ.');

    // 2. LẤY PHIM
    const existingMovies = await Movie.find();
    if (existingMovies.length === 0) {
        console.error('❌ Không có phim. Chạy seedMovies.js trước.');
        process.exit(1);
    }

    // 3. LẤY RẠP (FIX SỐ LƯỢNG RẠP)
    let allTheaters = await Theater.find();
    if (allTheaters.length === 0) {
        // Tạo rạp nếu chưa có... (giữ nguyên logic tạo cũ)
        const brands = [
            { name: "CGV Aeon Mall", city: "Hà Nội", address: "Long Biên, HN", coords: [105.9, 21.02] },
            { name: "Lotte Nam Sài Gòn", city: "Hồ Chí Minh", address: "Quận 7, TP.HCM", coords: [106.7, 10.73] },
            { name: "Galaxy Kinh Dương Vương", city: "Hồ Chí Minh", address: "Quận 6, TP.HCM", coords: [106.63, 10.75] },
            { name: "BHD Star Bitexco", city: "Hồ Chí Minh", address: "Quận 1, TP.HCM", coords: [106.70, 10.77] }
        ];
        for (const b of brands) {
            const t = await Theater.create({
                name: b.name, slug: faker.helpers.slugify(b.name).toLowerCase(),
                address: b.address, city: b.city, location: { type: "Point", coordinates: b.coords },
                rooms: [{ roomName: "Cinema 01", roomType: "2D", totalSeats: 100, rows: 10, seatsPerRow: 10, seatMap: generateSeatMap() }]
            });
            allTheaters.push(t);
        }
    }
    
    // QUAN TRỌNG: Chỉ lấy tối đa 4 rạp để loop, tránh nhân bản quá nhiều
    const activeTheaters = allTheaters.slice(0, 4);
    console.log(`✅ Sử dụng ${activeTheaters.length} rạp để tạo lịch.`);

    // 4. TẠO STAFF & CUSTOMER
    const passwordHash = await bcrypt.hash('123456', 10);
    const staffByTheater = {};

    // Staff cho 4 rạp active
    for (const theater of activeTheaters) {
        let staffs = await User.find({ role: 'staff', 'staffInfo.assignedTheater': theater._id });
        if (staffs.length === 0) {
            const s = await User.create({
                fullName: `NV ${theater.name.split(' ')[0]}`,
                email: `staff_${theater._id.toString().slice(-4)}_${randomInt(100,999)}@test.com`,
                password: passwordHash,
                role: 'staff',
                authProviders: ['local'],
                staffInfo: { position: 'cashier', salary: 6000000, assignedTheater: theater._id }
            });
            staffs.push(s);
        }
        staffByTheater[theater._id] = staffs;
    }

    // Customer
    let customers = await User.find({ role: 'customer' });
    if (customers.length < 10) {
        const newCus = Array.from({ length: 10 }).map(() => ({
            fullName: faker.person.fullName(),
            email: `user_${faker.string.alphanumeric(5)}@test.com`,
            password: passwordHash,
            role: 'customer',
            authProviders: ['local']
        }));
        try { await User.insertMany(newCus, { ordered: false }); } catch(e) {}
        customers = await User.find({ role: 'customer' });
    }

    // 5. LOOP TẠO LỊCH CHIẾU (Target ~400)
    console.log('📅 Đang rải lịch...');
    
    const schedules = [];
    const bookings = [];
    const reviews = [];
    const staffKpiMap = {};
    const reviewedPairs = new Set();

    let currentDate = dayjs('2025-01-01');
    const endDate = dayjs('2026-03-30');

    while (currentDate.isBefore(endDate)) {
        // Chỉ lấy Thứ 6, T7, CN
        if ([5, 6, 0].includes(currentDate.day())) {
            
            // Loop qua 4 rạp active
            for (const theater of activeTheaters) {
                // Xác suất 50% rạp này có lịch vào ngày cuối tuần
                // 195 ngày cuối tuần * 4 rạp * 0.5 = ~390 lịch
                if (Math.random() > 0.5) continue;

                if (!theater.rooms?.length) continue;
                const room = theater.rooms[0];
                const movie = existingMovies[randomInt(0, existingMovies.length - 1)];
                
                // Giờ đẹp: 19:00 - 20:00
                const startHour = randomInt(19, 20); 
                const startDayjs = currentDate.hour(startHour).minute(0);
                const endDayjs = startDayjs.add(movie.duration || 120, 'minute');

                // Status
                let status = 'Đang mở bán vé';
                if (startDayjs.isBefore(dayjs())) status = 'Đã chiếu';

                // Schedule
                const schedule = new Schedule({
                    movie: movie._id, theater: theater._id, room: room._id || room,
                    roomName: room.roomName || "Rạp 1", roomType: room.roomType || "2D", totalSeats: 100,
                    showDate: startDayjs.startOf('day').toDate(),
                    startTime: startDayjs.format('HH:mm'), endTime: endDayjs.format('HH:mm'),
                    ticketPrices: { standard: 85000, vip: 110000, couple: 180000 },
                    status: status
                });
                schedules.push(schedule);

                // Booking (0-3 vé/lịch)
                const bookingCount = randomInt(0, 3);
                for (let b = 0; b < bookingCount; b++) {
                    const customer = customers[randomInt(0, customers.length - 1)];
                    if (!customer) continue;

                    const isOnline = Math.random() > 0.3;
                    const price = 85000;
                    const bStatus = status === 'Đã chiếu' ? 'Hoàn tất' : 'Chờ thanh toán';

                    bookings.push({
                        customer: customer._id, schedule: schedule._id,
                        movieTitle: movie.title, theaterName: theater.name, roomName: schedule.roomName,
                        showDate: schedule.showDate, showTime: `${schedule.startTime} - ${schedule.endTime}`,
                        seats: [{ seatNumber: `A${b+1}`, seatType: 'Thường', price }],
                        ticketsAmount: price, subtotal: price, totalAmount: price, status: bStatus,
                        paymentDetails: { paymentMethod: isOnline ? 'MoMo' : 'Tại quầy', status: bStatus === 'Hoàn tất' ? 'Thành công' : 'Chờ thanh toán', amount: price },
                        isOnline: isOnline, createdAt: startDayjs.subtract(randomInt(1, 24), 'hour').toDate()
                    });

                    // KPI
                    if (!isOnline && bStatus === 'Hoàn tất') {
                        const staffs = staffByTheater[theater._id];
                        if (staffs?.length) {
                            const st = staffs[0];
                            const k = `${st._id}_${startDayjs.month()}_${startDayjs.year()}`;
                            if (!staffKpiMap[k]) staffKpiMap[k] = { staff: st, theater: theater, month: startDayjs.month(), year: startDayjs.year(), revenue: 0, count: 0 };
                            staffKpiMap[k].revenue += price;
                            staffKpiMap[k].count++;
                        }
                    }

                    // Review
                    const rKey = `${customer._id}_${movie._id}`;
                    if (bStatus === 'Hoàn tất' && Math.random() > 0.8 && !reviewedPairs.has(rKey)) {
                        reviews.push({
                            customer: customer._id, movie: movie._id, rating: randomInt(4, 5),
                            comment: `Phim hay, rạp ${theater.name} ổn!`, status: 'Đã duyệt',
                            createdAt: startDayjs.add(2, 'hour').toDate()
                        });
                        reviewedPairs.add(rKey);
                    }
                }
            }
        }
        currentDate = currentDate.add(1, 'day');
    }

    // 6. LƯU DB
    console.log(`💾 Đang lưu: ${schedules.length} Schedules, ${bookings.length} Bookings...`);
    await Schedule.insertMany(schedules);
    await Booking.insertMany(bookings);
    if (reviews.length) await Review.insertMany(reviews, { ordered: false }).catch(()=>{});

    // 7. LƯU KPI
    const kpis = Object.values(staffKpiMap).map(d => ({
        period: 'monthly', startDate: dayjs().year(d.year).month(d.month).startOf('month').toDate(),
        endDate: dayjs().year(d.year).month(d.month).endOf('month').toDate(),
        staff: d.staff._id, staffName: d.staff.fullName, position: 'cashier',
        theater: d.theater._id, theaterName: d.theater.name,
        sales: { totalRevenue: d.revenue, ticketsSold: d.count, totalTransactions: d.count, averageTransactionValue: d.revenue/d.count }
    }));
    if (kpis.length) await StaffKPI.insertMany(kpis);

    console.log(`✅ XONG! Đã tạo ${schedules.length} lịch chiếu.`);
    process.exit();
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedData();