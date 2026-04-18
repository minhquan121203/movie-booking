import mongoose from "mongoose";
import Shift from "../models/shift.model.js";
import ShiftAssignment from "../models/shiftAssignment.model.js";
import ShiftTemplate from "../models/shiftTemplate.model.js";
import Theater from "../models/theater.model.js";
import User from "../models/user.model.js";
import WorkSchedule from "../models/workSchedule.model.js";
import { AppError } from "../utils/errors.js";

class ShiftManagementService {
  async createShift(shiftData) {
    const staff = await User.findById(shiftData.staff);
    if (!staff || staff.role !== "staff") {
      throw new AppError("Invalid staff member", 400);
    }

    const theater = await Theater.findById(shiftData.theater);
    if (!theater) {
      throw new AppError("Theater not found", 404);
    }

    const conflictingShift = await Shift.findOne({
      staff: shiftData.staff,
      date: shiftData.date,
      status: { $nin: ["cancelled", "no-show"] },
      $or: [{ startTime: { $lte: shiftData.endTime }, endTime: { $gte: shiftData.startTime } }],
    });

    if (conflictingShift) {
      throw new AppError("Staff already has a shift during this time", 400);
    }

    const scheduledHours = this.calculateScheduledHours(shiftData.startTime, shiftData.endTime);

    // Create Shift plus compatible WorkSchedule and ShiftAssignment in a transaction
    const session = await mongoose.startSession();
    let createdShift = null;
    try {
      await session.withTransaction(async () => {
        const [s] = await Shift.create([{ ...shiftData, scheduledHours, status: "scheduled" }], { session });
        createdShift = s;

        // Ensure a ShiftTemplate exists for this shiftType (use shiftType as code)
        const tplCode = shiftData.shiftType || `T_${shiftData.startTime}_${shiftData.endTime}`;
        const tpl = await ShiftTemplate.findOneAndUpdate(
          { code: tplCode },
          {
            $setOnInsert: {
              code: tplCode,
              name: shiftData.shiftType || tplCode,
              startTime: shiftData.startTime,
              endTime: shiftData.endTime,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );

        // compute date string YYYY-MM-DD
        const dateObj = shiftData.date instanceof Date ? shiftData.date : new Date(shiftData.date);
        const dateStr = dateObj.toISOString().slice(0, 10);

        // create WorkSchedule linked to legacy Shift
        const wsDoc = {
          date: dateStr,
          theaterId: shiftData.theater,
          shiftTemplateId: tpl._id,
          startDateTime: new Date(dateStr + "T" + shiftData.startTime + ":00Z"),
          endDateTime: (() => {
            let e = new Date(dateStr + "T" + shiftData.endTime + ":00Z");
            if (e <= new Date(dateStr + "T" + shiftData.startTime + ":00Z")) {
              // overnight
              e = new Date(e.getTime() + 24 * 60 * 60 * 1000);
            }
            return e;
          })(),
          status: "open",
          createdBy: shiftData.createdBy || shiftData.staff,
          legacyShiftId: s._id,
        };

        const [ws] = await WorkSchedule.create([wsDoc], { session });

        // create ShiftAssignment linking the staff to this WorkSchedule
        await ShiftAssignment.create(
          [
            {
              workScheduleId: ws._id,
              userId: shiftData.staff,
              role: shiftData.position || "staff",
              assignedBy: shiftData.createdBy || shiftData.staff,
              legacyShiftId: s._id,
            },
          ],
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    if (!createdShift) throw new AppError("Failed to create shift", 500);
    return createdShift.populate(["staff", "theater"]);
  }

  async checkIn(shiftId, checkInData) {
    const shift = await Shift.findById(shiftId);
    if (!shift) throw new AppError("Shift not found", 404);
    if (shift.status !== "scheduled" && shift.status !== "confirmed") {
      throw new AppError("Cannot check in for this shift", 400);
    }
    shift.checkIn = { time: new Date(), location: checkInData.location, method: checkInData.method || "manual" };
    shift.status = "in-progress";
    await shift.save();

    // Sync to ShiftAssignment if exists
    try {
      const assignment = await ShiftAssignment.findOne({ legacyShiftId: shift._id });
      if (assignment) {
        assignment.checkInTime = shift.checkIn.time;
        assignment.checkInLocation = checkInData.location
          ? { type: "Point", coordinates: checkInData.location.coordinates || [] }
          : assignment.checkInLocation;
        assignment.status = "active";
        await assignment.save();
      }
    } catch (syncErr) {
      console.error("Sync check-in to ShiftAssignment failed:", syncErr);
    }
    return shift;
  }

  async checkOut(shiftId, checkOutData) {
    const shift = await Shift.findById(shiftId);
    if (!shift) throw new AppError("Shift not found", 404);
    if (shift.status !== "in-progress") throw new AppError("Cannot check out for this shift", 400);
    shift.checkOut = { time: new Date(), location: checkOutData.location, method: checkOutData.method || "manual" };
    if (checkOutData.breakTime) shift.break.actual = checkOutData.breakTime;
    shift.calculateActualHours();
    shift.status = "completed";
    await shift.save();

    // Sync to ShiftAssignment if exists
    try {
      const assignment = await ShiftAssignment.findOne({ legacyShiftId: shift._id });
      if (assignment) {
        assignment.checkOutTime = shift.checkOut.time;
        assignment.checkOutLocation = checkOutData.location
          ? { type: "Point", coordinates: checkOutData.location.coordinates || [] }
          : assignment.checkOutLocation;
        assignment.status = "completed";
        await assignment.save();
      }
    } catch (syncErr) {
      console.error("Sync check-out to ShiftAssignment failed:", syncErr);
    }
    return shift;
  }

  async getShiftsByTheater(theaterId, startDate, endDate, filter = {}) {
    return await Shift.find({ theater: theaterId, date: { $gte: startDate, $lte: endDate }, ...filter })
      .populate("staff", "fullName email phone")
      .sort({ date: 1, startTime: 1 });
  }

  async getShiftsByStaff(staffId, startDate, endDate, filter = {}) {
    return await Shift.find({ staff: staffId, date: { $gte: startDate, $lte: endDate }, ...filter })
      .populate("theater", "name location")
      .sort({ date: 1, startTime: 1 });
  }

  async requestShiftSwap(shiftId, requestData) {
    const shift = await Shift.findById(shiftId);
    if (!shift) throw new AppError("Shift not found", 404);
    if (shift.status !== "scheduled") throw new AppError("Can only swap scheduled shifts", 400);
    shift.swapRequest = { requestedBy: requestData.requestedBy, status: "pending" };
    await shift.save();
    return shift;
  }

  async approveShiftSwap(shiftId, approverId, newStaffId) {
    const shift = await Shift.findById(shiftId);
    if (!shift || !shift.swapRequest) throw new AppError("Shift swap request not found", 404);
    shift.staff = newStaffId;
    shift.swapRequest.status = "approved";
    shift.swapRequest.approvedBy = approverId;
    await shift.save();
    return shift;
  }

  async getAttendanceReport(theaterId, startDate, endDate) {
    const shifts = await Shift.find({ theater: theaterId, date: { $gte: startDate, $lte: endDate } }).populate(
      "staff",
      "fullName"
    );
    const report = {
      totalShifts: shifts.length,
      completed: shifts.filter((s) => s.status === "completed").length,
      noShows: shifts.filter((s) => s.status === "no-show").length,
      cancelled: shifts.filter((s) => s.status === "cancelled").length,
      totalHours: shifts.reduce((sum, s) => sum + (s.actualHours || 0), 0),
      overtimeHours: shifts.reduce((sum, s) => sum + (s.overtime?.hours || 0), 0),
      staffAttendance: {},
    };
    shifts.forEach((shift) => {
      const staffId = shift.staff._id.toString();
      if (!report.staffAttendance[staffId]) {
        report.staffAttendance[staffId] = {
          name: shift.staff.fullName,
          shifts: 0,
          completed: 0,
          hours: 0,
          overtime: 0,
        };
      }
      report.staffAttendance[staffId].shifts++;
      if (shift.status === "completed") {
        report.staffAttendance[staffId].completed++;
        report.staffAttendance[staffId].hours += shift.actualHours || 0;
        report.staffAttendance[staffId].overtime += shift.overtime?.hours || 0;
      }
    });
    return report;
  }

  calculateScheduledHours(startTime, endTime) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  }

  async generateSchedule(theaterId, startDate, endDate, staffList) {
    const shifts = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const shiftTypes = [
        { type: "morning", start: "08:00", end: "14:00" },
        { type: "afternoon", start: "14:00", end: "20:00" },
        { type: "evening", start: "20:00", end: "02:00" },
      ];
      for (const shiftType of shiftTypes) {
        for (const staff of staffList) {
          const shift = await this.createShift({
            theater: theaterId,
            staff: staff.id,
            shiftType: shiftType.type,
            date: new Date(currentDate),
            startTime: shiftType.start,
            endTime: shiftType.end,
            position: staff.position,
          });
          shifts.push(shift);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return shifts;
  }
}

export default new ShiftManagementService();
