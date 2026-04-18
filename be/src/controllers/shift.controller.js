import catchAsync from "../middlewares/catchAsync.middleware.js";
import Shift from "../models/shift.model.js";
import shiftService from "../services/shift-management.service.js";
import { successResponse } from "../utils/response.js";

const createShift = catchAsync(async (req, res) => {
  const shift = await shiftService.createShift(req.body);
  successResponse(res, shift, "Shift created successfully", 201);
});

const getShiftsByTheater = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  let { startDate, endDate, active } = req.query;

  // Build Filter
  const filter = {};
  if (active === "true" || active === undefined) {
    filter.status = { $ne: "cancelled" };
  } else if (active === "false") {
    filter.status = "cancelled";
  }
  // active === 'all', no filter


  // Validate and set default dates if not provided
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Default: 7 days ago
  } else {
    startDate = new Date(startDate);
  }

  if (!endDate) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default: 7 days later
  } else {
    endDate = new Date(endDate);
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE",
        message: "Invalid date format. Use YYYY-MM-DD or ISO format",
        field: "date",
      },
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        field: "date",
      },
    });
  }

  const shifts = await shiftService.getShiftsByTheater(theaterId, startDate, endDate, filter);
  successResponse(res, shifts, "Shifts retrieved successfully");
});

const getMyTheaterShifts = catchAsync(async (req, res) => {
  // Get the logged-in staff's assigned theater
  const staff = await Shift.findOne({ staff: req.user._id }).populate("theater");

  if (!staff || !staff.theater) {
    return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Staff is not assigned to any theater",
      },
    });
  }

  let { startDate, endDate, active } = req.query;

  // Build Filter
  const filter = {};
  if (active === "true" || active === undefined) {
    filter.status = { $ne: "cancelled" };
  } else if (active === "false") {
    filter.status = "cancelled";
  }

  // Validate and set default dates if not provided
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate = new Date(startDate);
  }

  if (!endDate) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate = new Date(endDate);
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE",
        message: "Invalid date format. Use YYYY-MM-DD or ISO format",
        field: "date",
      },
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        field: "date",
      },
    });
  }

  const shifts = await shiftService.getShiftsByTheater(staff.theater._id, startDate, endDate, filter);
  successResponse(res, shifts, "Shifts retrieved successfully");
});

const getShiftsByStaff = catchAsync(async (req, res) => {
  const { staffId } = req.params;
  let { startDate, endDate, active } = req.query;

  // Build Filter
  const filter = {};
  if (active === "true" || active === undefined) {
    filter.status = { $ne: "cancelled" };
  } else if (active === "false") {
    filter.status = "cancelled";
  }

  // Validate and set default dates if not provided
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate = new Date(startDate);
  }

  if (!endDate) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate = new Date(endDate);
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE",
        message: "Invalid date format. Use YYYY-MM-DD or ISO format",
        field: "date",
      },
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        field: "date",
      },
    });
  }

  const shifts = await shiftService.getShiftsByStaff(staffId, startDate, endDate, filter);
  successResponse(res, shifts, "Shifts retrieved successfully");
});

const checkIn = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const shift = await shiftService.checkIn(shiftId, req.body);
  successResponse(res, shift, "Checked in successfully");
});

const checkOut = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const shift = await shiftService.checkOut(shiftId, req.body);
  successResponse(res, shift, "Checked out successfully");
});

const requestShiftSwap = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const shift = await shiftService.requestShiftSwap(shiftId, { ...req.body, requestedBy: req.user._id });
  successResponse(res, shift, "Shift swap requested successfully");
});

const approveShiftSwap = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const { newStaffId } = req.body;
  const shift = await shiftService.approveShiftSwap(shiftId, req.user._id, newStaffId);
  successResponse(res, shift, "Shift swap approved successfully");
});

const getAttendanceReport = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  let { startDate, endDate } = req.query;

  // Validate and set default dates if not provided
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Default: 7 days ago
  } else {
    startDate = new Date(startDate);
  }

  if (!endDate) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default: 7 days later
  } else {
    endDate = new Date(endDate);
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE",
        message: "Invalid date format. Use YYYY-MM-DD or ISO format",
        field: "date",
      },
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        field: "date",
      },
    });
  }

  const report = await shiftService.getAttendanceReport(theaterId, startDate, endDate);
  successResponse(res, report, "Attendance report generated successfully");
});

const generateSchedule = catchAsync(async (req, res) => {
  const { theaterId, startDate, endDate, staffList } = req.body;

  // Validate required fields
  if (!theaterId || !startDate || !endDate || !staffList) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELDS",
        message: "theaterId, startDate, endDate, and staffList are required",
      },
    });
  }

  let start = new Date(startDate);
  let end = new Date(endDate);

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE",
        message: "Invalid date format. Use YYYY-MM-DD or ISO format",
        field: "date",
      },
    });
  }

  if (start > end) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        field: "date",
      },
    });
  }

  const shifts = await shiftService.generateSchedule(theaterId, start, end, staffList);
  successResponse(res, shifts, "Schedule generated successfully", 201);
});

const updateShift = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const shift = await Shift.findByIdAndUpdate(shiftId, req.body, { new: true, runValidators: true }).populate([
    "staff",
    "theater",
  ]);
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  successResponse(res, shift, "Shift updated successfully");
});

const deleteShift = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const shift = await Shift.findByIdAndUpdate(shiftId, { status: "cancelled" }, { new: true });
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  successResponse(res, shift, "Shift cancelled successfully");
});

const getShiftsFlexible = catchAsync(async (req, res) => {
  const { theaterId, staffId } = req.query;
  let { startDate, endDate, active } = req.query;

  // Build Filter
  const filter = {};
  if (active === "true" || active === undefined) {
    filter.status = { $ne: "cancelled" };
  } else if (active === "false") {
    filter.status = "cancelled";
  }

  // Validate and set default dates
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate = new Date(startDate);
  }

  if (!endDate) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate = new Date(endDate);
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE",
        message: "Invalid date format. Use YYYY-MM-DD or ISO format",
        field: "date",
      },
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        field: "date",
      },
    });
  }

  let shifts;

  // Case 1: Only theaterId - get all shifts of that theater
  if (theaterId && !staffId) {
    shifts = await shiftService.getShiftsByTheater(theaterId, startDate, endDate, filter);
  }
  // Case 2: Only staffId - get all shifts of that staff
  else if (staffId && !theaterId) {
    shifts = await shiftService.getShiftsByStaff(staffId, startDate, endDate, filter);
  }
  // Case 3: Both theaterId and staffId - get shifts of specific staff in specific theater
  else if (theaterId && staffId) {
    shifts = await Shift.find({
      theater: theaterId,
      staff: staffId,
      date: { $gte: startDate, $lte: endDate },
      ...filter,
    })
      .populate("staff", "fullName email phone")
      .populate("theater", "name location")
      .sort({ date: 1, startTime: 1 });
  }
  // Case 4: No params - get all shifts
  else {
    shifts = await Shift.find({ date: { $gte: startDate, $lte: endDate }, ...filter })
      .populate("staff", "fullName email phone")
      .populate("theater", "name location")
      .sort({ date: 1, startTime: 1 });
  }

  successResponse(res, shifts, "Shifts retrieved successfully");
});

export default {
  createShift,
  getShiftsByTheater,
  getMyTheaterShifts,
  getShiftsByStaff,
  getShiftsFlexible,
  checkIn,
  checkOut,
  requestShiftSwap,
  approveShiftSwap,
  getAttendanceReport,
  generateSchedule,
  updateShift,
  deleteShift,
};
