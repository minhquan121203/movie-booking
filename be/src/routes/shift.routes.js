const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shift.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);

router.post("/", authorize("admin", "manager"), shiftController.createShift);

router.get("/theater/:theaterId", authorize("admin", "manager", "staff"), shiftController.getShiftsByTheater);

router.get("/staff/:staffId", authorize("admin", "manager", "staff"), shiftController.getShiftsByStaff);

router.post("/:shiftId/check-in", authorize("staff", "manager"), shiftController.checkIn);

router.post("/:shiftId/check-out", authorize("staff", "manager"), shiftController.checkOut);

router.post("/:shiftId/swap-request", authorize("staff"), shiftController.requestShiftSwap);

router.post("/:shiftId/swap-approve", authorize("admin", "manager"), shiftController.approveShiftSwap);

router.get("/attendance/:theaterId", authorize("admin", "manager"), shiftController.getAttendanceReport);

router.post("/generate-schedule", authorize("admin", "manager"), shiftController.generateSchedule);

router.put("/:shiftId", authorize("admin", "manager"), shiftController.updateShift);

router.delete("/:shiftId", authorize("admin", "manager"), shiftController.deleteShift);

module.exports = router;
