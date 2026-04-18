import performanceService from "../services/performance-tracking.service.js";
import kpiService from "../services/kpi-calculation.service.js";
import catchAsync from "../middlewares/catchAsync.middleware.js";
import { successResponse } from "../utils/response.js";
import StaffKPI from "../models/staff-kpi.model.js";
import PerformanceMetric from "../models/performance-metric.model.js";

const trackTheaterPerformance = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  const { date = new Date(), period = "daily" } = req.body;
  const metric = await performanceService.trackTheaterPerformance(theaterId, new Date(date), period);
  successResponse(res, metric, "Theater performance tracked successfully", 201);
});

const trackStaffPerformance = catchAsync(async (req, res) => {
  const { staffId } = req.params;
  const { date = new Date(), period = "daily" } = req.body;
  const metric = await performanceService.trackStaffPerformance(staffId, new Date(date), period);
  successResponse(res, metric, "Staff performance tracked successfully", 201);
});

const trackMoviePerformance = catchAsync(async (req, res) => {
  const { movieId } = req.params;
  const { date = new Date(), period = "daily" } = req.body;
  const metric = await performanceService.trackMoviePerformance(movieId, new Date(date), period);
  successResponse(res, metric, "Movie performance tracked successfully", 201);
});

const getPerformanceHistory = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { startDate, endDate, period = "daily" } = req.query;
  const metrics = await performanceService.getPerformanceHistory(
    entityType,
    entityId,
    new Date(startDate),
    new Date(endDate),
    period
  );
  successResponse(res, metrics, "Performance history retrieved successfully");
});

const getPerformanceComparison = catchAsync(async (req, res) => {
  const { entityType } = req.params;
  const { entityIds, date = new Date(), period = "daily" } = req.query;
  const metrics = await performanceService.getPerformanceComparison(
    entityType,
    entityIds.split(","),
    new Date(date),
    period
  );
  successResponse(res, metrics, "Performance comparison retrieved successfully");
});

const getStaffKPI = catchAsync(async (req, res) => {
  const { staffId } = req.params;
  const { startDate, endDate } = req.query;
  const query = { staff: staffId };
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  const kpis = await StaffKPI.find(query).populate("staff", "fullName email").sort({ date: -1 });
  successResponse(res, kpis, "Staff KPIs retrieved successfully");
});

const calculateStaffKPI = catchAsync(async (req, res) => {
  const { staffId } = req.params;
  const { date = new Date() } = req.body;
  const kpi = await kpiService.calculateStaffKPI(staffId, new Date(date));
  successResponse(res, kpi, "Staff KPI calculated successfully", 201);
});

const getTheaterKPIs = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  const { date = new Date(), period = "daily" } = req.query;
  const metric = await PerformanceMetric.findOne({
    entityType: "theater",
    entityId: theaterId,
    date: new Date(date),
    period,
  });
  if (!metric) return res.status(404).json({ message: "Performance metrics not found" });
  successResponse(res, metric.kpis, "Theater KPIs retrieved successfully");
});

const getMovieKPIs = catchAsync(async (req, res) => {
  const { movieId } = req.params;
  const { date = new Date(), period = "daily" } = req.query;
  const metric = await PerformanceMetric.findOne({
    entityType: "movie",
    entityId: movieId,
    date: new Date(date),
    period,
  });
  if (!metric) return res.status(404).json({ message: "Performance metrics not found" });
  successResponse(res, metric.kpis, "Movie KPIs retrieved successfully");
});

const getPerformanceAlerts = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.params;
  const metrics = await PerformanceMetric.find({
    entityType,
    entityId,
    "alerts.0": { $exists: true },
  })
    .sort({ date: -1 })
    .limit(10);
  const alerts = metrics.flatMap((m) =>
    m.alerts.map((alert) => ({ ...alert.toObject(), date: m.date, entityType: m.entityType, entityId: m.entityId }))
  );
  successResponse(res, alerts, "Performance alerts retrieved successfully");
});

const getPerformanceTrends = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { startDate, endDate, period = "daily" } = req.query;
  const metrics = await PerformanceMetric.find({
    entityType,
    entityId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    period,
  }).sort({ date: 1 });
  const trends = {
    dates: metrics.map((m) => m.date),
    revenue: metrics.map((m) => m.metrics.revenue?.total || 0),
    attendance: metrics.map((m) => m.metrics.attendance?.count || 0),
    satisfaction: metrics.map((m) => m.metrics.customerSatisfaction?.rating || 0),
    overall: metrics.map((m) => m.trends),
  };
  successResponse(res, trends, "Performance trends retrieved successfully");
});

const getTopPerformers = catchAsync(async (req, res) => {
  const { entityType, period = "daily", limit = 10 } = req.query;
  const date = new Date();
  const metrics = await PerformanceMetric.find({ entityType, date, period })
    .sort({ "metrics.revenue.total": -1 })
    .limit(parseInt(limit));
  successResponse(res, metrics, "Top performers retrieved successfully");
});

export default {
  trackTheaterPerformance,
  trackStaffPerformance,
  trackMoviePerformance,
  getPerformanceHistory,
  getPerformanceComparison,
  getStaffKPI,
  calculateStaffKPI,
  getTheaterKPIs,
  getMovieKPIs,
  getPerformanceAlerts,
  getPerformanceTrends,
  getTopPerformers,
};
