import express from "express";

// Import controllers
import analyticsController from "../controllers/analytics.controller.js";
import authController from "../controllers/auth.controller.js";
import bookingController from "../controllers/booking.controller.js";
import counterBookingController from "../controllers/counter-booking.controller.js";
import customerSupportController from "../controllers/customer-support.controller.js";
import genreController from "../controllers/genre.controller.js";
import movieController from "../controllers/movie.controller.js";
import paymentController from "../controllers/payment.controller.js";
import performanceController from "../controllers/performance.controller.js";
import productController from "../controllers/product.controller.js";
import qrScannerController from "../controllers/qr-scanner.controller.js";
import reviewController from "../controllers/review.controller.js";
import scheduleController from "../controllers/schedule.controller.js";
import shiftController from "../controllers/shift.controller.js";
import shiftAssignmentController from "../controllers/shiftAssignment.controller.js";
import shiftTemplateController from "../controllers/shiftTemplate.controller.js";
import staffReportsController from "../controllers/staff-reports.controller.js";
import staffController from "../controllers/staff.controller.js";
import statisticsController from "../controllers/statistics.controller.js";
import theaterController from "../controllers/theater.controller.js";
import ticketValidationController from "../controllers/ticket-validation.controller.js";
import uploadController from "../controllers/upload.controller.js";
import userController from "../controllers/user.controller.js";
import voucherController from "../controllers/voucher.controller.js";
import workScheduleController from "../controllers/workSchedule.controller.js";
import * as chatController from "../controllers/chat.controller.js";

// Import middleware
import { checkAge } from "../middlewares/age-check.middleware.js";
import { authenticateToken, authorize, requireActiveShift } from "../middlewares/auth.middleware.js";
import {
  bookingRateLimiter,
  passwordResetRateLimiter,
  paymentRateLimiter,
} from "../middlewares/rate-limit.middleware.js";
import uploadMiddleware from "../middlewares/upload.middleware.js";
import {
  sanitizeInput,
  validateBookingInput,
  validateLoginInput,
  validateObjectId,
  validateRegisterInput,
} from "../middlewares/validation.middleware.js";

const router = express.Router();

//  FIX #5: Apply sanitization to all routes
router.use(sanitizeInput);

// ============================================
// PUBLIC ROUTES (Không cần authentication)
// ============================================

//  FIX #5 & #9: Add validation and rate limiting
router.post("/auth/register", validateRegisterInput, authController.register);
router.post("/auth/login", validateLoginInput, authController.login);
router.post("/auth/refresh-token", authController.refreshToken);
router.post("/auth/google-login", authController.googleLogin);
router.post("/auth/forgot-password", passwordResetRateLimiter, authController.forgotPassword);
router.post("/auth/reset-password", passwordResetRateLimiter, authController.resetPassword);
router.post("/auth/set-password", authenticateToken, authController.setPassword);



router.get("/movies", movieController.getAllMovies);
router.get("/movies/now-showing", movieController.getNowShowingMovies);
router.get("/movies/upcoming", movieController.getUpcomingMovies);
router.get("/movies/:id", movieController.getMovieById);
router.get("/movies/genre/:genreId", movieController.getMoviesByGenre);

// Schedule routes (public)
router.get("/schedules", scheduleController.getAllSchedules);
router.get("/schedules/movie/:movieId", scheduleController.getSchedulesByMovie);
router.get("/schedules/theater/:theaterId", scheduleController.getSchedulesByTheater);
router.get("/schedules/:id", scheduleController.getScheduleById);

// Theater routes (public)
router.get("/theaters", theaterController.getAllTheaters);
router.get("/theaters/:id", theaterController.getTheaterById);
router.get("/theaters/city/:city", theaterController.getTheatersByCity);

// Genre routes (public)
router.get("/genres", genreController.getAllGenres);
router.get("/genres/:id", genreController.getGenreById);

// Review routes (public - read only)
router.get("/reviews/movie/:movieId", reviewController.getReviewsByMovie);

// Product routes (public)
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);

// Voucher routes (public - verify only)
router.post("/vouchers/verify", voucherController.verifyVoucher);

// AI & CHATBOT ROUTES
router.post("/chat", chatController.handleChat);

// ============================================
// PROTECTED ROUTES (Cần authentication)
// ============================================

// User routes (Customer)
router.get("/auth/me", authenticateToken, authController.getCurrentUser);
router.put("/auth/change-password", authenticateToken, authController.changePassword);
router.post("/user/verify-age", authenticateToken, userController.verifyAge);
router.get("/user/age-status", authenticateToken, userController.getAgeStatus);
router.put("/users/profile", authenticateToken, userController.updateProfile);
router.get("/users/loyalty-points", authenticateToken, userController.getLoyaltyPoints);
router.get("/users/spending-stats", authenticateToken, userController.getSpendingStats);

//  FIX #5 & #9: Add validation and rate limiting for bookings
router.post("/bookings", authenticateToken, bookingRateLimiter, validateBookingInput, checkAge, bookingController.createBooking);
router.get("/bookings/my-bookings", authenticateToken, bookingController.getMyBookings);
router.get("/bookings/code/:bookingCode", bookingController.getBookingByCode);
router.get("/bookings/:id", authenticateToken, validateObjectId("id"), bookingController.getBookingById);
router.post(
  "/bookings/:id/confirm-payment",
  authenticateToken,
  paymentRateLimiter,
  validateObjectId("id"),
  bookingController.confirmPayment
);
router.post("/bookings/:id/cancel", authenticateToken, validateObjectId("id"), bookingController.cancelBooking);
router.post(
  "/bookings/:id/regenerate-qr",
  authenticateToken,
  validateObjectId("id"),
  bookingController.regenerateQRCode
);

// Review routes (Customer - write)
router.post("/reviews", authenticateToken, reviewController.createReview);
router.put("/reviews/:id", authenticateToken, reviewController.updateReview);
router.delete("/reviews/:id", authenticateToken, reviewController.deleteReview);

// ============================================
// STAFF ROUTES (Nhân viên rạp)
// ============================================

// Staff profile & dashboard
router.get("/staff/profile", authenticateToken, authorize("staff"), staffController.getProfile);
router.put("/staff/profile", authenticateToken, authorize("staff"), staffController.updateProfile);
router.get("/staff/dashboard", authenticateToken, authorize("staff"), staffController.getDashboard);
router.get("/staff/theater", authenticateToken, authorize("staff"), staffController.getAssignedTheater);
router.get("/staff/permissions/:permission", authenticateToken, authorize("staff"), staffController.hasPermission);

// Counter booking - Require active shift
router.post(
  "/staff/bookings",
  authenticateToken,
  authorize("staff"),
  requireActiveShift,
  counterBookingController.createBooking
);
router.post(
  "/staff/concession",
  authenticateToken,
  authorize("staff"),
  // requireActiveShift,
  counterBookingController.createConcessionBooking
);
router.get(
  "/staff/bookings/my-transactions",
  authenticateToken,
  authorize("staff"),
  counterBookingController.getMyTransactions
);
router.get(
  "/staff/bookings/theater-transactions",
  authenticateToken,
  authorize("staff"),
  counterBookingController.getTheaterTransactions
);

// Ticket validation - Require active shift
router.post(
  "/staff/tickets/validate-code",
  authenticateToken,
  authorize("staff"),
  requireActiveShift,
  ticketValidationController.validateByBookingCode
);
router.post(
  "/staff/tickets/validate-qr",
  authenticateToken,
  authorize("staff"),
  requireActiveShift,
  ticketValidationController.validateByQRCode
);
router.get(
  "/staff/tickets/my-validations",
  authenticateToken,
  authorize("staff"),
  ticketValidationController.getMyValidations
);
router.get(
  "/staff/tickets/theater-entries",
  authenticateToken,
  authorize("staff"),
  ticketValidationController.getTheaterEntries
);
router.get(
  "/staff/tickets/check/:bookingCode",
  authenticateToken,
  authorize("staff"),
  ticketValidationController.checkTicketStatus
);

// Customer support - Complaints
router.post("/staff/complaints", authenticateToken, authorize("staff"), customerSupportController.createComplaint);
router.get("/staff/complaints", authenticateToken, authorize("staff", "admin"), customerSupportController.getComplaints);
router.get("/staff/complaints/:id", authenticateToken, authorize("staff", "admin"), customerSupportController.getComplaintById);
router.put(
  "/staff/complaints/:id/status",
  authenticateToken,
  authorize("staff", "admin"),
  customerSupportController.updateComplaintStatus
);
router.post(
  "/staff/complaints/:id/resolve",
  authenticateToken,
  authorize("staff"),
  customerSupportController.resolveComplaint
);

// Customer support - Incidents
router.post("/staff/incidents", authenticateToken, authorize("staff"), customerSupportController.reportIncident);
router.get("/staff/incidents", authenticateToken, authorize("staff"), customerSupportController.getIncidents);
router.get("/staff/incidents/:id", authenticateToken, authorize("staff"), customerSupportController.getIncidentById);
router.post(
  "/staff/incidents/:id/acknowledge",
  authenticateToken,
  authorize("staff"),
  customerSupportController.acknowledgeIncident
);
router.post(
  "/staff/incidents/:id/resolve",
  authenticateToken,
  authorize("staff"),
  customerSupportController.resolveIncident
);
router.post(
  "/staff/incidents/:id/actions",
  authenticateToken,
  authorize("staff"),
  customerSupportController.addIncidentAction
);

// Daily reports
router.get("/staff/reports/draft", authenticateToken, authorize("staff"), staffReportsController.getDraftReport);
router.get(
  "/staff/reports/generate-data",
  authenticateToken,
  authorize("staff"),
  staffReportsController.generateReportData
);
router.put("/staff/reports/:id", authenticateToken, authorize("staff"), staffReportsController.updateReport);
router.post("/staff/reports/:id/submit", authenticateToken, authorize("staff"), staffReportsController.submitReport);
router.get("/staff/reports/my-reports", authenticateToken, authorize("staff"), staffReportsController.getMyReports);
router.get("/staff/reports/theater", authenticateToken, authorize("staff"), staffReportsController.getTheaterReports);
router.post("/staff/reports/:id/review", authenticateToken, authorize("staff"), staffReportsController.reviewReport);
router.get("/staff/reports/stats", authenticateToken, authorize("staff"), staffReportsController.getReportStats);

// ============================================
// QR SCANNER & HARDWARE INTEGRATION (Staff)
// ============================================

// QR validation - Require active shift for staff
router.post(
  "/qr-scanner/validate",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.validateQR
);
router.post(
  "/qr-scanner/quick-validate",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.quickValidate
);

// Check-in via QR - Require active shift for staff
router.post(
  "/qr-scanner/scan-check-in",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.scanCheckIn
);
router.post(
  "/qr-scanner/check-in-by-code",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.checkInByCode
);
router.post(
  "/qr-scanner/bulk-check-in",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.bulkCheckIn
);

// QR generation - Require active shift for staff
router.post(
  "/qr-scanner/generate/:bookingId",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.generateQR
);

// Booking code verification - Require active shift for staff
router.post(
  "/qr-scanner/verify-code",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  requireActiveShift,
  qrScannerController.verifyBookingCode
);

// History and statistics
router.get(
  "/qr-scanner/history/:theaterId",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  qrScannerController.getScanHistory
);
router.get(
  "/qr-scanner/statistics/:theaterId",
  authenticateToken,
  authorize("admin", "manager"),
  qrScannerController.getScanStatistics
);

// Camera stream initialization
router.post(
  "/qr-scanner/init-camera",
  authenticateToken,
  authorize("staff", "admin", "manager"),
  qrScannerController.initCameraStream
);

// Testing endpoint
router.post("/qr-scanner/test", authenticateToken, authorize("admin"), qrScannerController.testScanner);

// ============================================
// SHIFT MANAGEMENT ROUTES (Staff & Manager)
// ============================================

// Shift routes
router.post("/shifts", authenticateToken, authorize("admin", "manager"), shiftController.createShift);
router.get("/shifts", authenticateToken, authorize("admin", "manager", "staff"), shiftController.getShiftsFlexible);
// Staff - view own theater shifts
router.get("/shifts/my-theater", authenticateToken, authorize("staff"), shiftController.getMyTheaterShifts);
// Admin/Manager - view any theater shifts
router.get(
  "/shifts/theater/:theaterId",
  authenticateToken,
  authorize("admin", "manager"),
  shiftController.getShiftsByTheater
);
// View shifts by staff member
router.get(
  "/shifts/staff/:staffId",
  authenticateToken,
  authorize("admin", "manager", "staff"),
  shiftController.getShiftsByStaff
);
router.post(
    "/shifts/:shiftId/check-in",
    authenticateToken,
    authorize("staff", "manager"),
    shiftController.checkIn
);
router.post(
    "/shifts/:shiftId/check-out",
    authenticateToken,
    authorize("staff", "manager"),
    shiftController.checkOut);
router.post(
    "/shifts/:shiftId/swap-request",
    authenticateToken,
    authorize("staff"),
    shiftController.requestShiftSwap);
router.post(
  "/shifts/:shiftId/swap-approve",
  authenticateToken,
  authorize("admin", "manager"),
  shiftController.approveShiftSwap
);
router.get(
  "/shifts/attendance/:theaterId",
  authenticateToken,
  authorize("admin", "manager"),
  shiftController.getAttendanceReport
);
router.post(
  "/shifts/generate-schedule",
  authenticateToken,
  authorize("admin", "manager"),
  shiftController.generateSchedule
);
router.put("/shifts/:shiftId", authenticateToken, authorize("admin", "manager"), shiftController.updateShift);
router.delete("/shifts/:shiftId", authenticateToken, authorize("admin", "manager"), shiftController.deleteShift);

// === New: Shift Template (Configuration) ===
// Public read, admin management
router.get("/shift-templates", shiftTemplateController.list);
router.post("/shift-templates", authenticateToken, authorize("admin", "super-admin"), shiftTemplateController.create);
router.get("/shift-templates/:id", shiftTemplateController.getById);
router.put(
  "/shift-templates/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  shiftTemplateController.update
);
router.delete(
  "/shift-templates/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  shiftTemplateController.remove
);

// === New: Work Schedules (Planning) ===
router.post(
  "/work-schedules/generate",
  authenticateToken,
  authorize("admin", "manager"),
  workScheduleController.generate
);
router.get("/work-schedules", authenticateToken, authorize("admin", "manager", "staff"), workScheduleController.list);
router.get(
  "/theaters/:theaterId/roster",
  authenticateToken,
  authorize("admin", "manager", "staff"),
  workScheduleController.roster
);
router.get(
  "/work-schedules/daily-roster",
  authenticateToken,
  authorize("admin", "manager", "staff"),
  workScheduleController.dailyRoster
);
router.delete(
  "/work-schedules/:workScheduleId",
  authenticateToken,
  authorize("admin", "manager"),
  workScheduleController.remove
);

// === New: Shift Assignments (Execution) ===
router.post(
  "/assignments/bulk",
  authenticateToken,
  authorize("admin", "manager"),
  shiftAssignmentController.bulkAssign
);
router.delete("/assignments/:id", authenticateToken, authorize("admin", "manager"), shiftAssignmentController.remove);
router.get(
  "/schedules/:scheduleId/assignments",
  authenticateToken,
  authorize("admin", "manager", "staff"),
  shiftAssignmentController.listBySchedule
);
router.get(
  "/assignments/of-user/:userId",
  authenticateToken,
  authorize("admin", "manager", "staff"),
  shiftAssignmentController.listByUser
);
router.post("/assignments/check-in", authenticateToken, authorize("staff"), shiftAssignmentController.checkIn);
router.post("/assignments/check-out", authenticateToken, authorize("staff"), shiftAssignmentController.checkOut);
router.post("/assignments/force-checkout", authenticateToken, authorize("admin", "manager"), shiftAssignmentController.managerForceCheckOut);

// ============================================
// ANALYTICS & REPORTING ROUTES (Admin & Manager)
// ============================================

// Analytics reports
router.post("/analytics/reports", authenticateToken, authorize("admin", "manager"), analyticsController.generateReport);
router.get("/analytics/reports", authenticateToken, authorize("admin", "manager"), analyticsController.getReports);
router.get(
  "/analytics/reports/:reportId",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getReport
);
router.delete(
  "/analytics/reports/:reportId",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.deleteReport
);
router.get(
  "/analytics/dashboard/:theaterId",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getDashboardMetrics
);
router.get(
  "/analytics/revenue",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getRevenueAnalytics
);
router.get(
  "/dashboard/product-sales",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getProductSalesStats
);
router.get(
  "/analytics/attendance",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getAttendanceAnalytics
);
router.get(
  "/analytics/movies",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getMoviePerformance
);
router.get(
  "/analytics/staff",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getStaffPerformance
);
router.get(
  "/analytics/theaters",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getTheaterPerformance
);
router.get(
  "/analytics/satisfaction",
  authenticateToken,
  authorize("admin", "manager"),
  analyticsController.getCustomerSatisfaction
);

// ============================================
// PERFORMANCE METRICS & KPI ROUTES (Admin & Manager)
// ============================================

// Performance tracking
router.post(
  "/performance/theater/:theaterId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.trackTheaterPerformance
);
router.post(
  "/performance/staff/:staffId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.trackStaffPerformance
);
router.post(
  "/performance/movie/:movieId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.trackMoviePerformance
);
router.get(
  "/performance/history/:entityType/:entityId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getPerformanceHistory
);
router.get(
  "/performance/comparison/:entityType",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getPerformanceComparison
);

// KPI routes
router.get(
  "/performance/kpi/staff/:staffId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getStaffKPI
);
router.post(
  "/performance/kpi/staff/:staffId/calculate",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.calculateStaffKPI
);
router.get(
  "/performance/kpi/theater/:theaterId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getTheaterKPIs
);
router.get(
  "/performance/kpi/movie/:movieId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getMovieKPIs
);

// Performance insights
router.get(
  "/performance/alerts/:entityType/:entityId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getPerformanceAlerts
);
router.get(
  "/performance/trends/:entityType/:entityId",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getPerformanceTrends
);
router.get(
  "/performance/top-performers",
  authenticateToken,
  authorize("admin", "manager"),
  performanceController.getTopPerformers
);

// ============================================
// ADMIN ROUTES
// ============================================

// Movie management (Admin)
router.post("/admin/movies", authenticateToken, authorize("admin", "super-admin"), movieController.createMovie);
router.put("/admin/movies/:id", authenticateToken, authorize("admin", "super-admin"), movieController.updateMovie);
router.delete("/admin/movies/:id", authenticateToken, authorize("admin", "super-admin"), movieController.deleteMovie);

// Schedule management (Admin)
router.post(
  "/admin/schedules",
  authenticateToken,
  authorize("admin", "super-admin"),
  scheduleController.createSchedule
);
router.get(
  "/admin/schedules/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  scheduleController.getScheduleById
);
router.put(
  "/admin/schedules/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  scheduleController.updateSchedule
);
router.post(
  "/admin/schedules/:id/cancel",
  authenticateToken,
  authorize("admin", "super-admin"),
  scheduleController.cancelSchedule
);
router.delete(
  "/admin/schedules/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  scheduleController.deleteSchedule
);

// Theater management (Admin)
router.post("/admin/theaters", authenticateToken, authorize("admin", "super-admin"), theaterController.createTheater);
router.put(
  "/admin/theaters/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  theaterController.updateTheater
);
router.delete(
  "/admin/theaters/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  theaterController.deleteTheater
);

// Room management (Admin)
router.post(
  "/admin/theaters/:theaterId/rooms",
  authenticateToken,
  authorize("admin", "super-admin"),
  theaterController.addRoom
);
router.put(
  "/admin/theaters/:theaterId/rooms/:roomId/seats",
  authenticateToken,
  authorize("admin", "super-admin"),
  theaterController.updateMultipleSeats
);

router.put(
  "/admin/theaters/:theaterId/rooms/:roomId",
  authenticateToken,
  authorize("admin", "super-admin"),
  theaterController.updateRoom
);
router.delete(
  "/admin/theaters/:theaterId/rooms/:roomId",
  authenticateToken,
  authorize("admin", "super-admin"),
  theaterController.deleteRoom
);

// Genre management (Admin)
router.post("/admin/genres", authenticateToken, authorize("admin", "super-admin"), genreController.createGenre);
router.put("/admin/genres/:id", authenticateToken, authorize("admin", "super-admin"), genreController.updateGenre);
router.delete("/admin/genres/:id", authenticateToken, authorize("admin", "super-admin"), genreController.deleteGenre);

// Review management (Admin)
router.get("/admin/reviews", authenticateToken, authorize("admin", "super-admin"), reviewController.getAllReviews);
router.put(
  "/admin/reviews/:id/approve",
  authenticateToken,
  authorize("admin", "super-admin"),
  reviewController.approveReview
);
router.put(
  "/admin/reviews/:id/reject",
  authenticateToken,
  authorize("admin", "super-admin"),
  reviewController.rejectReview
);
router.delete(
  "/admin/reviews/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  reviewController.deleteReviewByAdmin
);

// User management (Admin)
router.get("/admin/users", authenticateToken, authorize("admin", "super-admin"), userController.getAllUsers);
router.get("/admin/users/:id", authenticateToken, authorize("admin", "super-admin"), userController.getUserById);
router.put(
  "/admin/users/:id/role",
  authenticateToken,
  authorize("admin", "super-admin"),
  userController.updateUserRole
);
router.delete("/admin/users/:id", authenticateToken, authorize("admin", "super-admin"), userController.deleteUser);

// Booking management (Admin)
router.get("/admin/bookings", authenticateToken, authorize("admin", "super-admin"), bookingController.getAllBookings);
router.post(
  "/admin/bookings/check-in",
  authenticateToken,
  authorize("admin", "super-admin"),
  bookingController.checkIn
);

// Product management (Admin)
router.post("/admin/products", authenticateToken, authorize("admin", "super-admin"), productController.createProduct);
router.put(
  "/admin/products/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  productController.updateProduct
);
router.delete(
  "/admin/products/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  productController.deleteProduct
);

// Voucher management (Admin)
router.get("/admin/vouchers", authenticateToken, authorize("admin", "super-admin"), voucherController.getAllVouchers);
router.post("/admin/vouchers", authenticateToken, authorize("admin", "super-admin"), voucherController.createVoucher);
router.put(
  "/admin/vouchers/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  voucherController.updateVoucher
);
router.delete(
  "/admin/vouchers/:id",
  authenticateToken,
  authorize("admin", "super-admin"),
  voucherController.deleteVoucher
);

// Staff management (Admin)
router.get("/admin/staff", authenticateToken, authorize("admin", "super-admin"), staffController.getAllStaff);
router.post(
  "/admin/staff/create",
  authenticateToken,
  authorize("admin", "super-admin"),
  staffController.createStaffAccount
);
router.post(
  "/admin/staff/assign-theater",
  authenticateToken,
  authorize("admin", "super-admin"),
  staffController.assignTheater
);
router.delete(
  "/admin/staff/:staffId/remove-theater",
  authenticateToken,
  authorize("admin", "super-admin"),
  staffController.removeTheaterAssignment
);
router.get(
  "/admin/staff/theater/:theaterId",
  authenticateToken,
  authorize("admin", "super-admin"),
  staffController.getStaffByTheater
);

// Statistics & Reports (Admin)
router.get(
  "/admin/dashboard/sumary-overview",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getSummaryOverview
);
router.get(
  "/admin/dashboard/top-movies",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getTopMovies
);
router.get(
  "/admin/dashboard/top-cinemas",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getTopCinemas
);
router.get(
  "/admin/dashboard/top-employees",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getTopEmployees
);
router.get(
  "/admin/dashboard/top-performance-movies",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getTopPerformanceMovies
);
router.get(
  "/admin/dashboard/top-effective-cinemas",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getTopEffectiveCinemas
);
router.get(
  "/admin/employee/kpi",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getEmployeeKPI
);
router.get(
  "/admin/performance/trend",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getPerformanceTrend
);
router.get(
  "/admin/revenue-views",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getRevenueAndViews
);
router.get(
  "/admin/performance/compare",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getPerformanceComparison
);
router.get(
  "/admin/statistics/overview",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getOverview
);
router.get(
  "/admin/statistics/revenue",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getRevenue
);
router.get(
  "/admin/statistics/movies",
  authenticateToken,
  authorize("admin", "super-admin"),
  statisticsController.getMovieStats
);

// ============================================
// PAYMENT ROUTES
// ============================================

// PayOS Webhook
router.post("/bookings/payos-webhook", bookingController.payosWebhook);

// VNPay
router.post("/bookings/:bookingId/payment/vnpay", authenticateToken, paymentController.createVNPayPayment);
router.get("/payment/vnpay-return", paymentController.handleVNPayReturn);
router.get("/payment/vnpay-ipn", paymentController.handleVNPayIPN);

// MoMo
router.post("/bookings/:bookingId/payment/momo", authenticateToken, paymentController.createMoMoPayment);
router.get("/payment/momo-return", paymentController.handleMoMoReturn);
router.post("/payment/momo-notify", paymentController.handleMoMoNotify);

// Payment utilities
router.get("/bookings/:bookingId/payment/status", authenticateToken, paymentController.queryPaymentStatus);
router.post(
  "/bookings/:bookingId/payment/refund",
  authenticateToken,
  authorize("admin", "super-admin"),
  paymentController.refundPayment
);

// ============================================
// UPLOAD ROUTES
// ============================================

// Movie poster
router.post(
  "/admin/movies/:movieId/upload-poster",
  authenticateToken,
  authorize("admin", "super-admin"),
  uploadMiddleware.single("poster"),
  uploadController.uploadMoviePoster
);

// User avatar
router.post(
  "/users/upload-avatar",
  authenticateToken,
  uploadMiddleware.single("avatar"),
  uploadController.uploadAvatar
);

// Product image
router.post(
  "/admin/products/:productId/upload-image",
  authenticateToken,
  authorize("admin", "super-admin"),
  uploadMiddleware.single("image"),
  uploadController.uploadProductImage
);

// Banner
router.post(
  "/admin/banners/upload",
  authenticateToken,
  authorize("admin", "super-admin"),
  uploadMiddleware.single("banner"),
  uploadController.uploadBanner
);

router.post(
  "/admin/banners/:bannerId/upload",
  authenticateToken,
  authorize("admin", "super-admin"),
  uploadMiddleware.single("banner"),
  uploadController.uploadBanner
);

// Multiple upload
router.post(
  "/admin/upload/multiple",
  authenticateToken,
  authorize("admin", "super-admin"),
  uploadMiddleware.multiple("images", 10),
  uploadController.uploadMultiple
);

// Delete image
router.delete(
  "/admin/upload/:publicId",
  authenticateToken,
  authorize("admin", "super-admin"),
  uploadController.deleteImage
);

export default router;
