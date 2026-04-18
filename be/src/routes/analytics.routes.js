const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);
router.use(authorize("admin", "manager"));

router.post("/reports", analyticsController.generateReport);

router.get("/reports", analyticsController.getReports);

router.get("/reports/:reportId", analyticsController.getReport);

router.delete("/reports/:reportId", analyticsController.deleteReport);

router.get("/dashboard/:theaterId", analyticsController.getDashboardMetrics);

router.get("/revenue", analyticsController.getRevenueAnalytics);

router.get("/attendance", analyticsController.getAttendanceAnalytics);

router.get("/movies", analyticsController.getMoviePerformance);

router.get("/staff", analyticsController.getStaffPerformance);

router.get("/theaters", analyticsController.getTheaterPerformance);

router.get("/satisfaction", analyticsController.getCustomerSatisfaction);

module.exports = router;
