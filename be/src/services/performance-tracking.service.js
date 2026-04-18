import Booking from "../models/booking.model.js";
import PerformanceMetric from "../models/performance-metric.model.js";
import Review from "../models/review.model.js";
import Schedule from "../models/schedule.model.js";
import Shift from "../models/shift.model.js";

class PerformanceTrackingService {
  async trackTheaterPerformance(theaterId, date, period = "daily") {
    const { startDate, endDate } = this.getDateRange(date, period);
    const bookings = await Booking.find({
      theater: theaterId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: "completed",
    });
    const schedules = await Schedule.find({ theater: theaterId, showTime: { $gte: startDate, $lte: endDate }, isDeleted: { $ne: true } });
    const revenue = {
      total: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      target: this.calculateRevenueTarget(period),
      achievement: 0,
    };
    revenue.achievement = (revenue.total / revenue.target) * 100;
    const attendance = {
      count: bookings.reduce((sum, b) => sum + b.seats.length, 0),
      target: schedules.length * 100,
      achievement: 0,
    };
    attendance.achievement = (attendance.count / attendance.target) * 100;
    const reviews = await Review.find({ theater: theaterId, createdAt: { $gte: startDate, $lte: endDate }, isDeleted: { $ne: true } });
    const customerSatisfaction = {
      rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      reviews: reviews.length,
      complaints: reviews.filter((r) => r.rating <= 2).length,
    };
    const metric = await PerformanceMetric.create({
      entityType: "theater",
      entityId: theaterId,
      date,
      period,
      metrics: {
        revenue,
        attendance,
        customerSatisfaction,
        operational: { uptime: 100, incidents: 0, maintenanceTime: 0 },
      },
      kpis: this.calculateTheaterKPIs(revenue, attendance, customerSatisfaction),
      trends: await this.calculateTrends("theater", theaterId, date, period),
    });
    return metric;
  }

  async trackStaffPerformance(staffId, date, period = "daily") {
    const { startDate, endDate } = this.getDateRange(date, period);
    const shifts = await Shift.find({ staff: staffId, date: { $gte: startDate, $lte: endDate }, status: "completed" });
    const totalHours = shifts.reduce((sum, s) => sum + (s.actualHours || 0), 0);
    const targetHours = shifts.reduce((sum, s) => sum + s.scheduledHours, 0);
    const efficiency = {
      score: 0,
      factors: {
        speed: this.calculateSpeedScore(shifts),
        accuracy: this.calculateAccuracyScore(shifts),
        quality: await this.calculateQualityScore(staffId, startDate, endDate),
      },
    };
    efficiency.score = (efficiency.factors.speed + efficiency.factors.accuracy + efficiency.factors.quality) / 3;
    const metric = await PerformanceMetric.create({
      entityType: "staff",
      entityId: staffId,
      date,
      period,
      metrics: {
        attendance: {
          count: shifts.length,
          target: this.getExpectedShifts(period),
          achievement: (shifts.length / this.getExpectedShifts(period)) * 100,
        },
        efficiency,
        operational: { uptime: (totalHours / targetHours) * 100, incidents: 0, maintenanceTime: 0 },
      },
      kpis: this.calculateStaffKPIs(shifts, efficiency),
      trends: await this.calculateTrends("staff", staffId, date, period),
    });
    return metric;
  }

  async trackMoviePerformance(movieId, date, period = "daily") {
    const { startDate, endDate } = this.getDateRange(date, period);
    const schedules = await Schedule.find({ movie: movieId, showTime: { $gte: startDate, $lte: endDate }, isDeleted: { $ne: true } });
    const bookings = await Booking.find({ schedule: { $in: schedules.map((s) => s._id) }, status: "completed" });
    const revenue = {
      total: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      target: schedules.length * 5000000,
      achievement: 0,
    };
    revenue.achievement = (revenue.total / revenue.target) * 100;
    const attendance = {
      count: bookings.reduce((sum, b) => sum + b.seats.length, 0),
      target: schedules.length * 100,
      achievement: 0,
    };
    attendance.achievement = (attendance.count / attendance.target) * 100;
    const reviews = await Review.find({ movie: movieId, createdAt: { $gte: startDate, $lte: endDate }, isDeleted: { $ne: true } });
    const customerSatisfaction = {
      rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      reviews: reviews.length,
      complaints: reviews.filter((r) => r.rating <= 2).length,
    };
    const metric = await PerformanceMetric.create({
      entityType: "movie",
      entityId: movieId,
      date,
      period,
      metrics: { revenue, attendance, customerSatisfaction },
      kpis: this.calculateMovieKPIs(revenue, attendance, customerSatisfaction, schedules.length),
      trends: await this.calculateTrends("movie", movieId, date, period),
    });
    return metric;
  }

  async getPerformanceHistory(entityType, entityId, startDate, endDate, period = "daily") {
    return await PerformanceMetric.find({
      entityType,
      entityId,
      date: { $gte: startDate, $lte: endDate },
      period,
    }).sort({ date: 1 });
  }

  async getPerformanceComparison(entityType, entityIds, date, period = "daily") {
    const metrics = await PerformanceMetric.find({ entityType, entityId: { $in: entityIds }, date, period });
    return metrics.sort((a, b) => (b.metrics.revenue?.achievement || 0) - (a.metrics.revenue?.achievement || 0));
  }

  calculateTheaterKPIs(revenue, attendance, satisfaction) {
    return [
      {
        name: "Revenue Achievement",
        value: revenue.total,
        target: revenue.target,
        unit: "VND",
        status: this.getKPIStatus(revenue.achievement),
      },
      {
        name: "Occupancy Rate",
        value: attendance.achievement,
        target: 80,
        unit: "%",
        status: this.getKPIStatus(attendance.achievement),
      },
      {
        name: "Customer Satisfaction",
        value: satisfaction.rating,
        target: 4.0,
        unit: "stars",
        status: this.getKPIStatus((satisfaction.rating / 5) * 100),
      },
    ];
  }

  calculateStaffKPIs(shifts, efficiency) {
    const punctuality =
      (shifts.filter((s) => {
        if (!s.checkIn?.time) return false;
        const scheduledStart = new Date(`${s.date.toISOString().split("T")[0]}T${s.startTime}`);
        return s.checkIn.time <= scheduledStart;
      }).length /
        shifts.length) *
      100;
    return [
      {
        name: "Attendance Rate",
        value: shifts.length,
        target: this.getExpectedShifts("daily"),
        unit: "shifts",
        status: this.getKPIStatus((shifts.length / this.getExpectedShifts("daily")) * 100),
      },
      { name: "Punctuality", value: punctuality, target: 95, unit: "%", status: this.getKPIStatus(punctuality) },
      {
        name: "Efficiency Score",
        value: efficiency.score,
        target: 80,
        unit: "points",
        status: this.getKPIStatus(efficiency.score),
      },
    ];
  }

  calculateMovieKPIs(revenue, attendance, satisfaction, showCount) {
    return [
      {
        name: "Revenue per Show",
        value: revenue.total / showCount,
        target: 5000000,
        unit: "VND",
        status: this.getKPIStatus((revenue.total / showCount / 5000000) * 100),
      },
      {
        name: "Average Attendance",
        value: attendance.count / showCount,
        target: 100,
        unit: "tickets",
        status: this.getKPIStatus((attendance.count / showCount / 100) * 100),
      },
      {
        name: "Audience Rating",
        value: satisfaction.rating,
        target: 4.0,
        unit: "stars",
        status: this.getKPIStatus((satisfaction.rating / 5) * 100),
      },
    ];
  }

  async calculateTrends(entityType, entityId, currentDate, period) {
    const previousDate = this.getPreviousDate(currentDate, period);
    const [current, previous] = await Promise.all([
      PerformanceMetric.findOne({ entityType, entityId, date: currentDate, period }),
      PerformanceMetric.findOne({ entityType, entityId, date: previousDate, period }),
    ]);
    if (!previous) return { direction: "stable", percentage: 0, comparison: "No previous data" };
    const currentRevenue = current?.metrics.revenue?.total || 0;
    const previousRevenue = previous?.metrics.revenue?.total || 0;
    const change = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    return {
      direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
      percentage: Math.abs(change),
      comparison: `vs previous ${period}`,
    };
  }

  getDateRange(date, period) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    switch (period) {
      case "hourly":
        startDate.setHours(startDate.getHours(), 0, 0, 0);
        endDate.setHours(endDate.getHours(), 59, 59, 999);
        break;
      case "daily":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
        break;
      case "monthly":
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
    }
    return { startDate, endDate };
  }

  getPreviousDate(date, period) {
    const previousDate = new Date(date);
    switch (period) {
      case "hourly":
        previousDate.setHours(previousDate.getHours() - 1);
        break;
      case "daily":
        previousDate.setDate(previousDate.getDate() - 1);
        break;
      case "weekly":
        previousDate.setDate(previousDate.getDate() - 7);
        break;
      case "monthly":
        previousDate.setMonth(previousDate.getMonth() - 1);
        break;
    }
    return previousDate;
  }

  calculateRevenueTarget(period) {
    const targets = { hourly: 500000, daily: 10000000, weekly: 70000000, monthly: 300000000 };
    return targets[period] || targets.daily;
  }

  getExpectedShifts(period) {
    const expected = { hourly: 0, daily: 1, weekly: 5, monthly: 20 };
    return expected[period] || expected.daily;
  }

  calculateSpeedScore(shifts) {
    return 85;
  }
  calculateAccuracyScore(shifts) {
    return 90;
  }
  async calculateQualityScore(staffId, startDate, endDate) {
    return 88;
  }

  getKPIStatus(achievement) {
    if (achievement >= 100) return "excellent";
    if (achievement >= 80) return "good";
    if (achievement >= 60) return "average";
    if (achievement >= 40) return "poor";
    return "critical";
  }
}

export default new PerformanceTrackingService();
