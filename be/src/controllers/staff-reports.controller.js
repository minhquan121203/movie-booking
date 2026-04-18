import mongoose from "mongoose";
import DailyReport from "../models/daily-report.model.js";
import CounterTransaction from "../models/counter-transaction.model.js";
import EntryLog from "../models/entry-log.model.js";
import Complaint from "../models/complaint.model.js";
import Incident from "../models/incident.model.js";
import User from "../models/user.model.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";

const staffReportsController = {
  // ============================================
  // DAILY REPORT MANAGEMENT
  // ============================================

  // Create or get draft daily report
  getDraftReport: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo báo cáo");
      }

      // Populate theater if assigned
      if (staff.staffInfo?.assignedTheater) {
        await staff.populate("staffInfo.assignedTheater");
      }

      const { date, shift } = req.query;
      const reportDate = date ? new Date(date) : new Date();
      reportDate.setHours(0, 0, 0, 0);

      // Try to find existing draft
      let report = await DailyReport.findOne({
        staff: staff._id,
        reportDate,
        shift: shift || staff.staffInfo?.shift || "morning",
        status: "draft",
      });

      // Create new draft if not exists
      if (!report) {
        report = new DailyReport({
          reportDate,
          shift: shift || staff.staffInfo?.shift || "morning",
          staff: staff._id,
          staffName: staff.fullName,
          position: staff.staffInfo?.position || "staff",
          theater: staff.staffInfo?.assignedTheater?._id,
          theaterName: staff.staffInfo?.assignedTheater?.name || "Unknown",
          status: "draft",
        });

        await report.save();
      }

      return successResponse(res, { report }, "Lấy báo cáo draft thành công");
    } catch (error) {
      console.error("Get draft report error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Auto-generate report data from system
  generateReportData: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo báo cáo");
      }

      const { date, shift } = req.query;
      const reportDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get transactions
      const transactions = await CounterTransaction.find({
        staff: staff._id,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: "completed",
      });

      // Get validations
      const validations = await EntryLog.find({
        validatedBy: staff._id,
        validatedAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      // Get complaints
      const complaints = await Complaint.find({
        receivedBy: staff._id,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      // Get incidents
      const incidents = await Incident.find({
        reportedBy: staff._id,
        reportedAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      // Calculate metrics
      const reportData = {
        sales: {
          totalTransactions: transactions.length,
          totalRevenue: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
          ticketsSold: transactions.reduce((sum, t) => sum + t.seats.length, 0),
          productsSold: transactions.reduce((sum, t) => sum + t.products.reduce((pSum, p) => pSum + p.quantity, 0), 0),
        },
        paymentBreakdown: {
          cash: transactions.filter((t) => t.paymentMethod === "cash").reduce((sum, t) => sum + t.totalAmount, 0),
          card: transactions.filter((t) => t.paymentMethod === "card").reduce((sum, t) => sum + t.totalAmount, 0),
          qr: transactions.filter((t) => t.paymentMethod === "qr").reduce((sum, t) => sum + t.totalAmount, 0),
          mixed: transactions.filter((t) => t.paymentMethod === "mixed").reduce((sum, t) => sum + t.totalAmount, 0),
        },
        customers: {
          totalCustomers: transactions.length,
          guestCustomers: transactions.filter((t) => t.isGuestCustomer).length,
        },
        validation: {
          totalValidations: validations.length,
          qrScans: validations.filter((v) => v.validationMethod === "qr_scan").length,
          manualValidations: validations.filter((v) => v.validationMethod === "booking_code").length,
          duplicateAttempts: validations.filter((v) => v.isDuplicate).length,
        },
        issues: {
          complaintsReceived: complaints.length,
          complaintsResolved: complaints.filter((c) => c.status === "resolved").length,
          incidentsReported: incidents.length,
          incidentsResolved: incidents.filter((i) => i.status === "resolved").length,
        },
      };

      return successResponse(res, { reportData }, "Tạo dữ liệu báo cáo thành công");
    } catch (error) {
      console.error("Generate report data error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Update daily report
  updateReport: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const report = await DailyReport.findById(id);
      if (!report) {
        throw new NotFoundError("Không tìm thấy báo cáo");
      }

      // Only allow updating draft reports
      if (report.status !== "draft") {
        return errorResponse(res, "Chỉ có thể cập nhật báo cáo draft", 400);
      }

      // Update fields
      if (updateData.sales) report.sales = { ...report.sales, ...updateData.sales };
      if (updateData.paymentBreakdown)
        report.paymentBreakdown = { ...report.paymentBreakdown, ...updateData.paymentBreakdown };
      if (updateData.customers) report.customers = { ...report.customers, ...updateData.customers };
      if (updateData.validation) report.validation = { ...report.validation, ...updateData.validation };
      if (updateData.issues) report.issues = { ...report.issues, ...updateData.issues };
      if (updateData.notes) report.notes = { ...report.notes, ...updateData.notes };
      if (updateData.attendance) report.attendance = { ...report.attendance, ...updateData.attendance };

      await report.save();

      return successResponse(res, { report }, "Cập nhật báo cáo thành công");
    } catch (error) {
      console.error("Update report error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Submit daily report
  submitReport: async (req, res) => {
    try {
      const { id } = req.params;

      const report = await DailyReport.findById(id);
      if (!report) {
        throw new NotFoundError("Không tìm thấy báo cáo");
      }

      if (report.status !== "draft") {
        return errorResponse(res, "Báo cáo đã được submit", 400);
      }

      await report.submit();

      return successResponse(res, { report }, "Submit báo cáo thành công");
    } catch (error) {
      console.error("Submit report error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get staff reports
  getMyReports: async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const query = {
        staff: req.userId,
        reportDate: {
          $gte: start,
          $lte: end,
        },
      };

      if (status) query.status = status;

      const reports = await DailyReport.find(query).sort({ reportDate: -1 });

      return successResponse(res, { reports }, "Lấy danh sách báo cáo thành công");
    } catch (error) {
      console.error("Get my reports error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get theater reports (supervisor/manager only)
  getTheaterReports: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);

      if (!staff || !["supervisor", "manager"].includes(staff.staffInfo?.position)) {
        throw new AuthorizationError("Chỉ supervisor/manager mới có thể xem báo cáo rạp");
      }

      if (!staff.staffInfo?.assignedTheater) {
        throw new NotFoundError("Chưa được phân công rạp");
      }

      const { date, status } = req.query;
      const queryDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      const query = {
        theater: staff.staffInfo.assignedTheater,
        reportDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      if (status) query.status = status;

      const reports = await DailyReport.find(query).populate("staff", "fullName").sort({ shift: 1, submittedAt: 1 });

      return successResponse(res, { reports }, "Lấy báo cáo rạp thành công");
    } catch (error) {
      console.error("Get theater reports error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Review report (supervisor/manager only)
  reviewReport: async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;

      const staff = await User.findById(req.userId);

      if (!["supervisor", "manager"].includes(staff.staffInfo?.position)) {
        throw new AuthorizationError("Chỉ supervisor/manager mới có thể review báo cáo");
      }

      const report = await DailyReport.findById(id);
      if (!report) {
        throw new NotFoundError("Không tìm thấy báo cáo");
      }

      await report.review(staff._id, staff.fullName, reviewNotes);

      return successResponse(res, { report }, "Review báo cáo thành công");
    } catch (error) {
      console.error("Review report error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get report statistics
  getReportStats: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const stats = await DailyReport.aggregate([
        {
          $match: {
            staff: new mongoose.Types.ObjectId(staff._id),
            reportDate: {
              $gte: start,
              $lte: end,
            },
            status: { $in: ["submitted", "reviewed", "approved"] },
          },
        },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            totalRevenue: { $sum: "$sales.totalRevenue" },
            totalTransactions: { $sum: "$sales.totalTransactions" },
            totalTicketsSold: { $sum: "$sales.ticketsSold" },
            totalValidations: { $sum: "$validation.totalValidations" },
            totalComplaints: { $sum: "$issues.complaintsReceived" },
            avgTransactionValue: { $avg: "$sales.averageTransactionValue" },
          },
        },
      ]);

      return successResponse(res, { stats: stats[0] || {} }, "Lấy thống kê báo cáo thành công");
    } catch (error) {
      console.error("Get report stats error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },
};

export default staffReportsController;
