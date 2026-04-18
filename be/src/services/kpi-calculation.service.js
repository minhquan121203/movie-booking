import StaffKPI from "../models/staff-kpi.model.js";
import CounterTransaction from "../models/counter-transaction.model.js";
import EntryLog from "../models/entry-log.model.js";
import Complaint from "../models/complaint.model.js";
import Incident from "../models/incident.model.js";
import DailyReport from "../models/daily-report.model.js";
import User from "../models/user.model.js";

class KPICalculationService {
  /**
   * Calculate KPIs for staff
   */
  async calculateStaffKPI(staffId, period, startDate, endDate) {
    try {
      const staff = await User.findById(staffId).populate("staffInfo.assignedTheater");

      if (!staff || staff.role !== "staff") {
        throw new Error("Invalid staff");
      }

      // Get transactions
      const transactions = await CounterTransaction.find({
        staff: staffId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
        status: "completed",
      });

      // Get validations
      const validations = await EntryLog.find({
        validatedBy: staffId,
        validatedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Get complaints
      const complaints = await Complaint.find({
        $or: [{ receivedBy: staffId }, { assignedTo: staffId }],
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Get incidents
      const incidents = await Incident.find({
        reportedBy: staffId,
        reportedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Get daily reports
      const reports = await DailyReport.find({
        staff: staffId,
        reportDate: {
          $gte: startDate,
          $lte: endDate,
        },
        status: { $in: ["submitted", "reviewed", "approved"] },
      });

      // Calculate sales KPIs
      const salesKPIs = {
        totalTransactions: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
        ticketsSold: transactions.reduce((sum, t) => sum + t.seats.length, 0),
        productsSold: transactions.reduce((sum, t) => sum + t.products.reduce((pSum, p) => pSum + p.quantity, 0), 0),
      };

      // Calculate customer service KPIs
      const resolvedComplaints = complaints.filter((c) => c.status === "resolved");
      const avgResolutionTime =
        resolvedComplaints.length > 0
          ? resolvedComplaints.reduce((sum, c) => {
              return sum + (c.resolvedAt - c.createdAt);
            }, 0) / resolvedComplaints.length
          : 0;

      const satisfactionRatings = complaints.filter((c) => c.satisfactionRating).map((c) => c.satisfactionRating);
      const avgSatisfaction =
        satisfactionRatings.length > 0
          ? satisfactionRatings.reduce((sum, r) => sum + r, 0) / satisfactionRatings.length
          : 0;

      const customerServiceKPIs = {
        customersServed: transactions.length,
        complaintsReceived: complaints.length,
        complaintsResolved: resolvedComplaints.length,
        averageResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)), // hours
        customerSatisfactionScore: Math.round(avgSatisfaction * 10) / 10,
      };

      // Calculate operational KPIs
      const duplicateAttempts = validations.filter((v) => v.isDuplicate).length;
      const resolvedIncidents = incidents.filter((i) => i.status === "resolved").length;

      const operationalKPIs = {
        ticketsValidated: validations.length,
        validationAccuracy:
          validations.length > 0
            ? Math.round(((validations.length - duplicateAttempts) / validations.length) * 100)
            : 100,
        duplicateDetections: duplicateAttempts,
        incidentsReported: incidents.length,
        incidentsResolved: resolvedIncidents,
      };

      // Calculate attendance KPIs
      const totalHours = reports.reduce((sum, r) => sum + (r.attendance.hoursWorked || 0), 0);
      const daysWorked = reports.length;

      const attendanceKPIs = {
        daysWorked,
        totalHours: Math.round(totalHours * 10) / 10,
        onTimeRate: 100, // Would need check-in data
        lateCount: 0,
        absenceCount: 0,
      };

      // Get or create KPI record
      let kpi = await StaffKPI.findOne({
        staff: staffId,
        period,
        startDate,
        endDate,
      });

      if (!kpi) {
        kpi = new StaffKPI({
          period,
          startDate,
          endDate,
          staff: staffId,
          staffName: staff.fullName,
          position: staff.staffInfo?.position,
          theater: staff.staffInfo?.assignedTheater?._id,
          theaterName: staff.staffInfo?.assignedTheater?.name,
        });
      }

      // Update KPIs
      kpi.sales = salesKPIs;
      kpi.customerService = customerServiceKPIs;
      kpi.operational = operationalKPIs;
      kpi.attendance = attendanceKPIs;
      kpi.status = "completed";
      kpi.calculatedAt = new Date();

      await kpi.save();

      return kpi;
    } catch (error) {
      console.error("Calculate staff KPI error:", error);
      throw error;
    }
  }

  /**
   * Calculate KPIs for all staff in theater
   */
  async calculateTheaterKPIs(theaterId, period, startDate, endDate) {
    try {
      const staffList = await User.find({
        role: "staff",
        "staffInfo.assignedTheater": theaterId,
        "staffInfo.isActive": true,
      });

      const kpis = [];

      for (const staff of staffList) {
        try {
          const kpi = await this.calculateStaffKPI(staff._id, period, startDate, endDate);
          kpis.push(kpi);
        } catch (error) {
          console.error(`Error calculating KPI for staff ${staff._id}:`, error);
        }
      }

      // Update rankings
      kpis.sort((a, b) => b.performance.overallScore - a.performance.overallScore);

      for (let i = 0; i < kpis.length; i++) {
        kpis[i].performance.ranking = i + 1;
        kpis[i].performance.totalStaffCount = kpis.length;
        await kpis[i].save();
      }

      return kpis;
    } catch (error) {
      console.error("Calculate theater KPIs error:", error);
      throw error;
    }
  }

  /**
   * Calculate daily KPIs (run by cron)
   */
  async calculateDailyKPIs() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Get all active theaters
      const Theater = (await import("../models/theater.model.js")).default;
      const theaters = await Theater.find({ isActive: true });

      let totalCalculated = 0;

      for (const theater of theaters) {
        const kpis = await this.calculateTheaterKPIs(theater._id, "daily", yesterday, endOfYesterday);
        totalCalculated += kpis.length;
      }

      console.log(`📊 Calculated ${totalCalculated} daily KPIs`);
      return totalCalculated;
    } catch (error) {
      console.error("Calculate daily KPIs error:", error);
      throw error;
    }
  }

  /**
   * Get staff performance summary
   */
  async getPerformanceSummary(staffId, period = "monthly") {
    try {
      const now = new Date();
      let startDate, endDate;

      switch (period) {
        case "daily":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "weekly":
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "quarterly":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }

      const kpis = await StaffKPI.find({
        staff: staffId,
        period,
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
        status: "completed",
      }).sort({ startDate: -1 });

      return {
        period,
        startDate,
        endDate,
        kpis,
        summary: kpis.length > 0 ? kpis[0] : null,
      };
    } catch (error) {
      console.error("Get performance summary error:", error);
      throw error;
    }
  }

  /**
   * Compare staff performance
   */
  async compareStaffPerformance(theaterId, period, startDate, endDate) {
    try {
      const kpis = await StaffKPI.find({
        theater: theaterId,
        period,
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
        status: "completed",
      })
        .populate("staff", "fullName")
        .sort({ "performance.overallScore": -1 });

      const comparison = {
        topPerformer: kpis[0],
        averageScore:
          kpis.length > 0 ? Math.round(kpis.reduce((sum, k) => sum + k.performance.overallScore, 0) / kpis.length) : 0,
        totalStaff: kpis.length,
        rankings: kpis.map((k, index) => ({
          rank: index + 1,
          staffId: k.staff._id,
          staffName: k.staff.fullName,
          position: k.position,
          overallScore: k.performance.overallScore,
          performanceLevel: k.performance.performanceLevel,
        })),
      };

      return comparison;
    } catch (error) {
      console.error("Compare staff performance error:", error);
      throw error;
    }
  }
}

const kpiCalculationService = new KPICalculationService();

export default kpiCalculationService;
