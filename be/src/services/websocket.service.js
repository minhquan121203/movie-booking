import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Schedule from "../models/schedule.model.js";

class WebSocketService {
  constructor() {
    this.io = null;
    this.scheduleRooms = new Map(); // scheduleId -> Set of socket IDs
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "https://movie-booking-cinema.vercel.app",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          // Allow guest users to view seats
          socket.userId = null;
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        console.error("Socket auth error:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Connection handler
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`, socket.userId ? `User: ${socket.userId}` : "Guest");

      // Join schedule room
      socket.on("join-schedule", async (data) => {
        await this.handleJoinSchedule(socket, data);
      });

      // Leave schedule room
      socket.on("leave-schedule", (data) => {
        this.handleLeaveSchedule(socket, data);
      });

      // Hold seats
      socket.on("hold-seats", async (data) => {
        await this.handleHoldSeats(socket, data);
      });

      // Release seats
      socket.on("release-seats", async (data) => {
        await this.handleReleaseSeats(socket, data);
      });

      // Book seats (confirm)
      socket.on("book-seats", async (data) => {
        await this.handleBookSeats(socket, data);
      });

      // Disconnect
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });

    console.log("🔌 WebSocket initialized");
  }

  async handleJoinSchedule(socket, data) {
    try {
      const { scheduleId } = data;

      if (!scheduleId) {
        socket.emit("error", { message: "Schedule ID is required" });
        return;
      }

      // Verify schedule exists
      const schedule = await Schedule.findById(scheduleId)
        .select("seatAvailability totalSeats bookedSeatsCount")
        .lean();

      if (!schedule) {
        socket.emit("error", { message: "Schedule not found" });
        return;
      }

      // Join room
      socket.join(`schedule:${scheduleId}`);

      // Track socket in room
      if (!this.scheduleRooms.has(scheduleId)) {
        this.scheduleRooms.set(scheduleId, new Set());
      }
      this.scheduleRooms.get(scheduleId).add(socket.id);

      // Send current seat status
      socket.emit("schedule-joined", {
        scheduleId,
        seatAvailability: schedule.seatAvailability,
        totalSeats: schedule.totalSeats,
        bookedSeatsCount: schedule.bookedSeatsCount,
        viewerCount: this.scheduleRooms.get(scheduleId).size,
      });

      // Notify others
      socket.to(`schedule:${scheduleId}`).emit("viewer-joined", {
        viewerCount: this.scheduleRooms.get(scheduleId).size,
      });

      console.log(`User ${socket.userId || "Guest"} joined schedule ${scheduleId}`);
    } catch (error) {
      console.error("Join schedule error:", error);
      socket.emit("error", { message: "Failed to join schedule" });
    }
  }

  handleLeaveSchedule(socket, data) {
    try {
      const { scheduleId } = data;

      if (!scheduleId) return;

      socket.leave(`schedule:${scheduleId}`, {success: true});

      // Remove from tracking
      if (this.scheduleRooms.has(scheduleId)) {
        this.scheduleRooms.get(scheduleId).delete(socket.id);

        // Notify others
        this.io.to(`schedule:${scheduleId}`).emit("viewer-left", {
          viewerCount: this.scheduleRooms.get(scheduleId).size,
        });

        // Clean up if empty
        if (this.scheduleRooms.get(scheduleId).size === 0) {
          this.scheduleRooms.delete(scheduleId);
        }
      }

      console.log(`User ${socket.userId || "Guest"} left schedule ${scheduleId}`);
    } catch (error) {
      console.error("Leave schedule error:", error);
    }
  }

  async handleHoldSeats(socket, data) {
    try {
      const { scheduleId, seatNumbers, holdDuration = 10 } = data;

      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required to hold seats" });
        return;
      }

      if (!scheduleId || !seatNumbers || seatNumbers.length === 0) {
        socket.emit("error", { message: "Invalid data" });
        return;
      }

      // Find schedule
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        socket.emit("error", { message: "Schedule not found" });
        return;
      }

      // Check if seats are available
      const unavailableSeats = [];
      for (const seatNumber of seatNumbers) {
        const seat = schedule.seatAvailability.find((s) => s.seatNumber === seatNumber);
        if (!seat) {
          unavailableSeats.push({ seatNumber, reason: "Seat not found" });
        } else if (seat.isBooked) {
          unavailableSeats.push({ seatNumber, reason: "Already booked" });
        } else if (
          seat.holdUntil &&
          seat.holdUntil > new Date() &&
          seat.bookedBy &&
          seat.bookedBy.toString() !== socket.userId
        ) {
          unavailableSeats.push({ seatNumber, reason: "Already held by another user" });
        }
      }

      if (unavailableSeats.length > 0) {
        socket.emit("seats-hold-failed", { unavailableSeats });
        return;
      }

      // Hold seats using atomic operation
      const holdUntil = new Date(Date.now() + holdDuration * 60 * 1000);

      const updatedSchedule = await Schedule.findOneAndUpdate(
        {
          _id: scheduleId,
          $and: seatNumbers.map((seatNum) => ({
            seatAvailability: {
              $elemMatch: {
                seatNumber: seatNum,
                isBooked: false,
                $or: [{ holdUntil: { $exists: false } }, { holdUntil: null }, { holdUntil: { $lt: new Date() } }],
              },
            },
          })),
        },
        {
          $set: seatNumbers.reduce((update, seatNum) => {
            update[`seatAvailability.$[seat_${seatNum}].holdUntil`] = holdUntil;
            update[`seatAvailability.$[seat_${seatNum}].bookedBy`] = socket.userId;
            return update;
          }, {}),
        },
        {
          arrayFilters: seatNumbers.map((seatNum) => ({
            [`seat_${seatNum}.seatNumber`]: seatNum,
          })),
          new: true,
        }
      );

      if (!updatedSchedule) {
        socket.emit("seats-hold-failed", {
          unavailableSeats: seatNumbers.map((seatNumber) => ({
            seatNumber,
            reason: "Already held by another user",
          })),
        });
        return;
      }

      // Emit to user
      socket.emit("seats-held", {
        scheduleId,
        seatNumbers,
        holdUntil,
        userId: socket.userId,
      });

      // Broadcast to all users in room with updated schedule
      socket.to(`schedule:${scheduleId}`).emit("seats-status-changed", {
        scheduleId,
        seatAvailability: updatedSchedule.seatAvailability,
        action: "held",
        seatNumbers,
        userId: socket.userId,
      });

      console.log(`User ${socket.userId} held seats ${seatNumbers.join(", ")} in schedule ${scheduleId}`);

      // Auto-release is now handled by cleanup service with Redis TTL
      // No need for setTimeout which is unreliable across server restarts
    } catch (error) {
      console.error("Hold seats error:", error);
      socket.emit("error", { message: "Failed to hold seats" });
    }
  }

  async handleReleaseSeats(socket, data) {
    try {
      const { scheduleId, seatNumbers } = data;

      if (!scheduleId || !seatNumbers) {
        socket.emit("error", { message: "Invalid data" });
        return;
      }

      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        socket.emit("error", { message: "Schedule not found" });
        return;
      }

      // Release seats (only if held by this user)
      const releasedSeats = [];
      for (const seatNumber of seatNumbers) {
        const seat = schedule.seatAvailability.find((s) => s.seatNumber === seatNumber);
        if (seat && !seat.isBooked && seat.bookedBy && seat.bookedBy.toString() === socket.userId) {
          seat.holdUntil = null;
          seat.bookedBy = null;
          releasedSeats.push(seatNumber);
        }
      }

      if (releasedSeats.length > 0) {
        await schedule.save();

        socket.emit("seats-released", {
          scheduleId,
          seatNumbers: releasedSeats,
        });

        // Broadcast to others
        socket.to(`schedule:${scheduleId}`).emit("seats-status-changed", {
          scheduleId,
          seatAvailability: schedule.seatAvailability,
          action: "released",
          seatNumbers: releasedSeats,
        });

        console.log(`User ${socket.userId} released seats ${releasedSeats.join(", ")}`);
      }
    } catch (error) {
      console.error("Release seats error:", error);
      socket.emit("error", { message: "Failed to release seats" });
    }
  }

  async handleBookSeats(socket, data) {
    try {
      const { scheduleId, seatNumbers, bookingId } = data;

      if (!scheduleId || !seatNumbers || !bookingId) {
        socket.emit("error", { message: "Invalid data" });
        return;
      }

      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        socket.emit("error", { message: "Schedule not found" });
        return;
      }

      // Confirm seats (mark as booked)
      await schedule.confirmSeats(seatNumbers, bookingId);

      socket.emit("seats-booked", {
        scheduleId,
        seatNumbers,
        bookingId,
      });

      // Broadcast to others
      this.io.to(`schedule:${scheduleId}`).emit("seats-status-changed", {
        scheduleId,
        seatAvailability: schedule.seatAvailability,
        action: "booked",
        seatNumbers,
      });

      console.log(`Seats ${seatNumbers.join(", ")} booked in schedule ${scheduleId}`);
    } catch (error) {
      console.error("Book seats error:", error);
      socket.emit("error", { message: "Failed to book seats" });
    }
  }

  async autoReleaseSeats(scheduleId, seatNumbers, userId) {
    try {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) return;

      let hasChanges = false;
      const releasedSeats = [];

      for (const seatNumber of seatNumbers) {
        const seat = schedule.seatAvailability.find((s) => s.seatNumber === seatNumber);
        if (
          seat &&
          !seat.isBooked &&
          seat.holdUntil &&
          seat.holdUntil <= new Date() &&
          seat.bookedBy &&
          seat.bookedBy.toString() === userId
        ) {
          seat.holdUntil = null;
          seat.bookedBy = null;
          releasedSeats.push(seatNumber);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await schedule.save();

        // Broadcast to all users
        this.io.to(`schedule:${scheduleId}`).emit("seats-status-changed", {
          scheduleId,
          seatAvailability: schedule.seatAvailability,
          action: "auto-released",
          seatNumbers: releasedSeats,
        });

        console.log(`Auto-released seats ${releasedSeats.join(", ")} in schedule ${scheduleId}`);
      }
    } catch (error) {
      console.error("Auto release seats error:", error);
    }
  }

  handleDisconnect(socket) {
    console.log(`Client disconnected: ${socket.id}`);

    // Clean up from all schedule rooms
    this.scheduleRooms.forEach((sockets, scheduleId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);

        // Notify others
        this.io.to(`schedule:${scheduleId}`).emit("viewer-left", {
          viewerCount: sockets.size,
        });

        // Clean up empty rooms
        if (sockets.size === 0) {
          this.scheduleRooms.delete(scheduleId);
        }
      }
    });

    // Auto-release any seats held by this user
    if (socket.userId) {
      this.autoReleaseUserSeats(socket.userId);
    }

    // Clean up socket references
    socket.removeAllListeners();
  }

  // Auto-release seats held by disconnected user
  async autoReleaseUserSeats(userId) {
    try {
      const Schedule = (await import("../models/schedule.model.js")).default;

      // Find all schedules with seats held by this user
      const schedulesWithHeldSeats = await Schedule.find({
        seatAvailability: {
          $elemMatch: {
            bookedBy: userId,
            holderType: "user",
            isBooked: false,
            holdUntil: { $gte: new Date() },
          },
        },
      });

      for (const schedule of schedulesWithHeldSeats) {
        const heldSeats = schedule.seatAvailability.filter(
          (seat) => seat.bookedBy && seat.bookedBy.toString() === userId && seat.holderType === "user" && !seat.isBooked
        );

        if (heldSeats.length > 0) {
          // Release seats
          heldSeats.forEach((seat) => {
            seat.holdUntil = null;
            seat.bookedBy = null;
            seat.holderType = "user";
          });

          await schedule.save();

          // Broadcast release to room
          this.io.to(`schedule:${schedule._id}`).emit("seats-status-changed", {
            scheduleId: schedule._id,
            seatAvailability: schedule.seatAvailability,
            action: "auto-released",
            seatNumbers: heldSeats.map((s) => s.seatNumber),
            reason: "User disconnected",
          });

          console.log(`Auto-released ${heldSeats.length} seats for disconnected user ${userId}`);
        }
      }
    } catch (error) {
      console.error("Auto release user seats error:", error);
    }
  }

  // Public method to emit events from other parts of the app
  emitToSchedule(scheduleId, event, data) {
    if (this.io) {
      this.io.to(`schedule:${scheduleId}`).emit(event, data);
    }
  }

  // Get viewer count for a schedule
  getViewerCount(scheduleId) {
    return this.scheduleRooms.has(scheduleId) ? this.scheduleRooms.get(scheduleId).size : 0;
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
