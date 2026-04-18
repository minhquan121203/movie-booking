import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/user.model.js";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Booking from "../models/booking.model.js";

describe("Booking Tests", () => {
  let customerToken;
  let customerId;
  let scheduleId;
  let movieId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/cinema_test";
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Theater.deleteMany({});
    await Schedule.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Theater.deleteMany({});
    await Schedule.deleteMany({});
    await Booking.deleteMany({});

    // Create customer
    const customerResponse = await request(app).post("/api/auth/register").send({
      email: "customer@example.com",
      password: "123456",
      fullName: "Test Customer",
    });

    customerToken = customerResponse.body.data.token;
    customerId = customerResponse.body.data.user.id;

    // Create movie
    const movie = await Movie.create({
      title: "Test Movie",
      status: "Đang chiếu",
      duration: 120,
      rating: "C13",
    });
    movieId = movie._id;

    // Create theater with rooms
    const theater = await Theater.create({
      name: "Test Theater",
      address: "Test Address",
      city: "Test City",
      rooms: [
        {
          roomName: "Room 1",
          roomType: "2D",
          totalSeats: 10,
          seatMap: [
            { seatNumber: "A1", seatType: "Thường", isAvailable: true },
            { seatNumber: "A2", seatType: "Thường", isAvailable: true },
            { seatNumber: "B1", seatType: "VIP", isAvailable: true },
            { seatNumber: "B2", seatType: "VIP", isAvailable: true },
          ],
        },
      ],
    });

    // Create schedule
    const schedule = await Schedule.create({
      movie: movieId,
      theater: theater._id,
      room: theater.rooms[0]._id,
      roomName: "Room 1",
      roomType: "2D",
      showDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      startTime: "19:00",
      endTime: "21:00",
      ticketPrices: {
        standard: 80000,
        vip: 120000,
      },
      seatAvailability: [
        { seatNumber: "A1", seatType: "Thường", isBooked: false },
        { seatNumber: "A2", seatType: "Thường", isBooked: false },
        { seatNumber: "B1", seatType: "VIP", isBooked: false },
        { seatNumber: "B2", seatType: "VIP", isBooked: false },
      ],
      totalSeats: 4,
    });
    scheduleId = schedule._id;
  });

  describe("POST /api/bookings", () => {
    it("should create booking successfully", async () => {
      const bookingData = {
        scheduleId: scheduleId.toString(),
        seats: [
          { seatNumber: "A1", seatType: "Thường", price: 80000 },
          { seatNumber: "A2", seatType: "Thường", price: 80000 },
        ],
        products: [],
        voucherCode: null,
      };

      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("bookingId");
      expect(response.body.data).toHaveProperty("bookingCode");
      expect(response.body.data.totalAmount).toBe(160000);
    });

    it("should fail if seats are already booked", async () => {
      // Book seats first
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          scheduleId: scheduleId.toString(),
          seats: [{ seatNumber: "A1", seatType: "Thường", price: 80000 }],
        });

      // Mark as booked
      await Schedule.findByIdAndUpdate(
        scheduleId,
        {
          $set: {
            "seatAvailability.$[elem].isBooked": true,
          },
        },
        {
          arrayFilters: [{ "elem.seatNumber": "A1" }],
        }
      );

      // Try to book same seat
      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          scheduleId: scheduleId.toString(),
          seats: [{ seatNumber: "A1", seatType: "Thường", price: 80000 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("đã được đặt");
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/api/bookings")
        .send({
          scheduleId: scheduleId.toString(),
          seats: [{ seatNumber: "A1", seatType: "Thường", price: 80000 }],
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/bookings/my-bookings", () => {
    beforeEach(async () => {
      // Create a booking
      await Booking.create({
        customer: customerId,
        schedule: scheduleId,
        movieTitle: "Test Movie",
        theaterName: "Test Theater",
        roomName: "Room 1",
        showDate: new Date(),
        showTime: "19:00 - 21:00",
        seats: [{ seatNumber: "A1", seatType: "Thường", price: 80000 }],
        ticketsAmount: 80000,
        productsAmount: 0,
        subtotal: 80000,
        discountAmount: 0,
        totalAmount: 80000,
        status: "Hoàn tất",
        paymentDetails: {
          paymentMethod: "Test",
          status: "Thành công",
          amount: 80000,
        },
      });
    });

    it("should get user bookings", async () => {
      const response = await request(app)
        .get("/api/bookings/my-bookings")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].movieTitle).toBe("Test Movie");
    });

    it("should filter bookings by status", async () => {
      const response = await request(app)
        .get("/api/bookings/my-bookings?status=Hoàn tất")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
    });
  });

  describe("POST /api/bookings/:id/cancel", () => {
    let bookingId;

    beforeEach(async () => {
      // Create a future booking that can be cancelled
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now

      const booking = await Booking.create({
        customer: customerId,
        schedule: scheduleId,
        movieTitle: "Test Movie",
        theaterName: "Test Theater",
        roomName: "Room 1",
        showDate: futureDate,
        showTime: "19:00 - 21:00",
        seats: [{ seatNumber: "A1", seatType: "Thường", price: 80000 }],
        ticketsAmount: 80000,
        productsAmount: 0,
        subtotal: 80000,
        discountAmount: 0,
        totalAmount: 80000,
        status: "Hoàn tất",
        paymentDetails: {
          paymentMethod: "Test",
          status: "Thành công",
          amount: 80000,
        },
      });
      bookingId = booking._id;

      // Update schedule with future date
      await Schedule.findByIdAndUpdate(scheduleId, {
        showDate: futureDate,
      });
    });

    it("should cancel booking successfully", async () => {
      const response = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          reason: "Test cancellation",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("refundAmount");
    });

    it("should fail to cancel non-existent booking", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/bookings/${fakeId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          reason: "Test",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
