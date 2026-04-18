const express = require("express");
const router = express.Router();
const performanceController = require("../controllers/performance.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);
router.use(authorize("admin", "manager"));

router.post("/theater/:theaterId", performanceController.trackTheaterPerformance);

router.post("/staff/:staffId", performanceController.trackStaffPerformance);

router.post("/movie/:movieId", performanceController.trackMoviePerformance);

router.get("/history/:entityType/:entityId", performanceController.getPerformanceHistory);

router.get("/comparison/:entityType", performanceController.getPerformanceComparison);

router.get("/kpi/staff/:staffId", performanceController.getStaffKPI);

router.post("/kpi/staff/:staffId/calculate", performanceController.calculateStaffKPI);

router.get("/kpi/theater/:theaterId", performanceController.getTheaterKPIs);

router.get("/kpi/movie/:movieId", performanceController.getMovieKPIs);

router.get("/alerts/:entityType/:entityId", performanceController.getPerformanceAlerts);

router.get("/trends/:entityType/:entityId", performanceController.getPerformanceTrends);

router.get("/top-performers", performanceController.getTopPerformers);

module.exports = router;
