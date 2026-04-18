import catchAsync from "../middlewares/catchAsync.middleware.js";
import AnalyticsReport from "../models/analytics-report.model.js";
import analyticsService from "../services/analytics.service.js";
import { getDeleteFilter } from "../utils/query.js";
import { successResponse } from "../utils/response.js";

const generateReport = catchAsync(async (req, res) => {
  const reportConfig = {
    ...req.body,
    userId: req.user._id,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
  };
  const report = await analyticsService.generateReport(reportConfig);
  successResponse(res, report, "Report generated successfully", 201);
});

const getReport = catchAsync(async (req, res) => {
  const { reportId } = req.params;
  const report = await AnalyticsReport.findById(reportId)
    .populate("theater", "name location")
    .populate("generatedBy", "fullName email");
  if (!report) return res.status(404).json({ message: "Report not found" });
  successResponse(res, report, "Report retrieved successfully");
});

const getReports = catchAsync(async (req, res) => {
  const { reportType, category, theater, startDate, endDate } = req.query;
  const query = { status: "completed", ...getDeleteFilter(req.query) };
  if (reportType) query.reportType = reportType;
  if (category) query.category = category;
  if (theater) query.theater = theater;
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate) };
    query.endDate = { $lte: new Date(endDate) };
  }
  const reports = await AnalyticsReport.find(query).populate("theater", "name").sort({ createdAt: -1 }).limit(50);
  successResponse(res, reports, "Reports retrieved successfully");
});

const getDashboardMetrics = catchAsync(async (req, res) => {
  const { theaterId } = req.params;
  const { period = "today" } = req.query;
  const metrics = await analyticsService.getDashboardMetrics(theaterId, period);
  successResponse(res, metrics, "Dashboard metrics retrieved successfully");
});

const getRevenueAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate, theater } = req.query;
  const config = { startDate: new Date(startDate), endDate: new Date(endDate), theater, category: "revenue" };
  const revenue = await analyticsService.getRevenueData(config);
  successResponse(res, revenue, "Revenue analytics retrieved successfully");
});

const getAttendanceAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate, theater } = req.query;
  const config = { startDate: new Date(startDate), endDate: new Date(endDate), theater, category: "attendance" };
  const attendance = await analyticsService.getAttendanceData(config);
  successResponse(res, attendance, "Attendance analytics retrieved successfully");
});

const getMoviePerformance = catchAsync(async (req, res) => {
  const { startDate, endDate, theater } = req.query;
  const config = { startDate: new Date(startDate), endDate: new Date(endDate), theater, category: "movie-performance" };
  const movies = await analyticsService.getMoviePerformance(config);
  successResponse(res, movies, "Movie performance retrieved successfully");
});

const getStaffPerformance = catchAsync(async (req, res) => {
  const { startDate, endDate, theater } = req.query;
  const config = { startDate: new Date(startDate), endDate: new Date(endDate), theater, category: "staff-performance" };
  const staff = await analyticsService.getStaffPerformance(config);
  successResponse(res, staff, "Staff performance retrieved successfully");
});

const getTheaterPerformance = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const config = { startDate: new Date(startDate), endDate: new Date(endDate), category: "theater-performance" };
  const theaters = await analyticsService.getTheaterPerformance(config);
  successResponse(res, theaters, "Theater performance retrieved successfully");
});

const getCustomerSatisfaction = catchAsync(async (req, res) => {
  const { startDate, endDate, theater } = req.query;
  const config = {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    theater,
    category: "customer-satisfaction",
  };
  const satisfaction = await analyticsService.getCustomerSatisfaction(config);
  successResponse(res, satisfaction, "Customer satisfaction retrieved successfully");
});

const deleteReport = catchAsync(async (req, res) => {
  const { reportId } = req.params;
  const report = await AnalyticsReport.findById(reportId);
  if (!report) return res.status(404).json({ message: "Report not found" });
  
  // Soft Delete
  report.isDeleted = true;
  await report.save();
  
  successResponse(res, null, "Report deleted successfully");
});

const getProductSalesStats = catchAsync(async (req, res) => {
  const { year = 2025, theater } = req.query;
  const stats = await analyticsService.getProductSalesStats({ year, theater });
  // The service now returns the formatted data structure requested by the user
  successResponse(res, stats, "Product sales statistics retrieved successfully");
});

export default {
  generateReport,
  getReport,
  getReports,
  getDashboardMetrics,
  getRevenueAnalytics,
  getAttendanceAnalytics,
  getMoviePerformance,
  getStaffPerformance,
  getTheaterPerformance,
  getCustomerSatisfaction,
  deleteReport,
  getProductSalesStats,
};
