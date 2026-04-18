import AnalyticsReport from "../models/analytics-report.model.js";
import Booking from "../models/booking.model.js";
import CounterTransaction from "../models/counter-transaction.model.js";
import Review from "../models/review.model.js";
import Schedule from "../models/schedule.model.js";
import Shift from "../models/shift.model.js";
import StaffKPI from "../models/staff-kpi.model.js";

class AnalyticsService {
  async generateReport(reportConfig) {
    const startTime = Date.now();
    const report = await AnalyticsReport.create({
      reportType: reportConfig.reportType,
      category: reportConfig.category,
      theater: reportConfig.theater,
      startDate: reportConfig.startDate,
      endDate: reportConfig.endDate,
      generatedBy: reportConfig.userId,
      status: "generating",
    });
    try {
      const data = await this.collectReportData(reportConfig);
      const insights = await this.generateInsights(data, reportConfig);
      const comparisons = await this.generateComparisons(reportConfig);
      report.data = data;
      report.insights = insights;
      report.comparisons = comparisons;
      report.status = "completed";
      report.metadata = {
        generationTime: Date.now() - startTime,
        dataPoints: this.countDataPoints(data),
        version: "1.0",
      };
      await report.save();
      return report;
    } catch (error) {
      report.status = "failed";
      await report.save();
      throw error;
    }
  }

  async collectReportData(config) {
    const data = {};
    if (config.category === "revenue" || config.category === "attendance") {
      data.revenue = await this.getRevenueData(config);
      data.attendance = await this.getAttendanceData(config);
    }
    if (config.category === "movie-performance") data.movies = await this.getMoviePerformance(config);
    if (config.category === "staff-performance") data.staff = await this.getStaffPerformance(config);
    if (config.category === "theater-performance") data.theaters = await this.getTheaterPerformance(config);
    if (config.category === "customer-satisfaction")
      data.customerSatisfaction = await this.getCustomerSatisfaction(config);
    return data;
  }

  async getRevenueData(config) {
    const query = { createdAt: { $gte: config.startDate, $lte: config.endDate }, status: "completed" };
    if (config.theater) query.theater = config.theater;
    const bookings = await Booking.find(query);
    const revenue = { total: 0, tickets: 0, products: 0, online: 0, counter: 0, growth: 0 };
    bookings.forEach((booking) => {
      const ticketRevenue =
        booking.totalPrice - (booking.products?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0);
      const productRevenue = booking.products?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0;
      revenue.total += booking.totalPrice;
      revenue.tickets += ticketRevenue;
      revenue.products += productRevenue;
      if (booking.bookingType === "online") revenue.online += booking.totalPrice;
      else revenue.counter += booking.totalPrice;
    });
    return revenue;
  }

  async getAttendanceData(config) {
    const query = { createdAt: { $gte: config.startDate, $lte: config.endDate }, status: "completed" };
    if (config.theater) query.theater = config.theater;
    const bookings = await Booking.find(query).populate("schedule");
    const attendance = {
      totalTickets: 0,
      totalCustomers: bookings.length,
      occupancyRate: 0,
      peakHours: [],
      averagePerShow: 0,
    };
    const hourCounts = {};
    let totalSeats = 0,
      occupiedSeats = 0;
    bookings.forEach((booking) => {
      attendance.totalTickets += booking.seats.length;
      occupiedSeats += booking.seats.length;
      if (booking.schedule?.showTime) {
        const hour = new Date(booking.schedule.showTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + booking.seats.length;
      }
      if (booking.schedule?.room?.capacity) totalSeats += booking.schedule.room.capacity;
    });
    if (totalSeats > 0) attendance.occupancyRate = (occupiedSeats / totalSeats) * 100;
    attendance.peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    attendance.averagePerShow = bookings.length > 0 ? attendance.totalTickets / bookings.length : 0;
    return attendance;
  }

  async getMoviePerformance(config) {
    const schedules = await Schedule.find({ showTime: { $gte: config.startDate, $lte: config.endDate } }).populate(
      "movie"
    );
    const movieStats = {};
    for (const schedule of schedules) {
      const movieId = schedule.movie._id.toString();
      if (!movieStats[movieId]) {
        movieStats[movieId] = { movie: schedule.movie._id, revenue: 0, tickets: 0, shows: 0, rating: 0, occupancy: 0 };
      }
      const bookings = await Booking.find({ schedule: schedule._id, status: "completed" });
      movieStats[movieId].shows++;
      bookings.forEach((booking) => {
        movieStats[movieId].revenue += booking.totalPrice;
        movieStats[movieId].tickets += booking.seats.length;
      });
      const reviews = await Review.find({ movie: schedule.movie._id });
      if (reviews.length > 0)
        movieStats[movieId].rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }
    return Object.values(movieStats);
  }

  async getStaffPerformance(config) {
    const shifts = await Shift.find({
      date: { $gte: config.startDate, $lte: config.endDate },
      status: "completed",
    }).populate("staff");
    const staffStats = {};
    shifts.forEach((shift) => {
      const staffId = shift.staff._id.toString();
      if (!staffStats[staffId]) {
        staffStats[staffId] = {
          staff: shift.staff._id,
          hoursWorked: 0,
          shiftsCompleted: 0,
          kpiScore: 0,
          performance: "average",
        };
      }
      staffStats[staffId].hoursWorked += shift.actualHours || 0;
      staffStats[staffId].shiftsCompleted++;
    });
    const kpis = await StaffKPI.find({ date: { $gte: config.startDate, $lte: config.endDate } });
    kpis.forEach((kpi) => {
      const staffId = kpi.staff.toString();
      if (staffStats[staffId]) {
        staffStats[staffId].kpiScore = kpi.overallScore;
        staffStats[staffId].performance = kpi.performanceLevel;
      }
    });
    return Object.values(staffStats);
  }

  async getTheaterPerformance(config) {
    const bookings = await Booking.find({
      createdAt: { $gte: config.startDate, $lte: config.endDate },
      status: "completed",
    }).populate("theater schedule");
    const theaterStats = {};
    bookings.forEach((booking) => {
      const theaterId = booking.theater._id.toString();
      if (!theaterStats[theaterId]) {
        theaterStats[theaterId] = { theater: booking.theater._id, revenue: 0, tickets: 0, occupancy: 0, shows: 0 };
      }
      theaterStats[theaterId].revenue += booking.totalPrice;
      theaterStats[theaterId].tickets += booking.seats.length;
    });
    return Object.values(theaterStats);
  }

  async getCustomerSatisfaction(config) {
    const reviews = await Review.find({ createdAt: { $gte: config.startDate, $lte: config.endDate } });
    const satisfaction = { averageRating: 0, totalReviews: reviews.length, complaints: 0, compliments: 0, nps: 0 };
    if (reviews.length > 0) {
      satisfaction.averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const promoters = reviews.filter((r) => r.rating >= 4).length;
      const detractors = reviews.filter((r) => r.rating <= 2).length;
      satisfaction.nps = ((promoters - detractors) / reviews.length) * 100;
      satisfaction.complaints = reviews.filter((r) => r.rating <= 2).length;
      satisfaction.compliments = reviews.filter((r) => r.rating >= 4).length;
    }
    return satisfaction;
  }

  async generateInsights(data, config) {
    const insights = [];
    if (data.revenue) {
      if (data.revenue.growth > 10) {
        insights.push({
          type: "achievement",
          title: "Revenue Growth",
          description: `Revenue increased by ${data.revenue.growth.toFixed(1)}%`,
          priority: "high",
          actionable: false,
        });
      } else if (data.revenue.growth < -10) {
        insights.push({
          type: "alert",
          title: "Revenue Decline",
          description: `Revenue decreased by ${Math.abs(data.revenue.growth).toFixed(1)}%`,
          priority: "critical",
          actionable: true,
        });
      }
    }
    if (data.attendance?.occupancyRate && data.attendance.occupancyRate < 50) {
      insights.push({
        type: "recommendation",
        title: "Low Occupancy",
        description: `Occupancy rate is ${data.attendance.occupancyRate.toFixed(1)}%. Consider promotional campaigns.`,
        priority: "high",
        actionable: true,
      });
    }
    if (data.customerSatisfaction?.averageRating < 3) {
      insights.push({
        type: "alert",
        title: "Customer Satisfaction",
        description: "Customer satisfaction is below acceptable levels",
        priority: "critical",
        actionable: true,
      });
    }
    return insights;
  }

  async generateComparisons(config) {
    const previousPeriod = this.getPreviousPeriod(config.startDate, config.endDate);
    const currentRevenue = await this.getRevenueData(config);
    const previousConfig = { ...config, startDate: previousPeriod.start, endDate: previousPeriod.end };
    const previousRevenue = await this.getRevenueData(previousConfig);
    return {
      previousPeriod: {
        revenue: previousRevenue.total,
        attendance: 0,
        growth: ((currentRevenue.total - previousRevenue.total) / previousRevenue.total) * 100,
      },
      yearOverYear: { revenue: 0, attendance: 0, growth: 0 },
    };
  }

  getPreviousPeriod(startDate, endDate) {
    const duration = endDate - startDate;
    return { start: new Date(startDate.getTime() - duration), end: new Date(startDate.getTime()) };
  }

  countDataPoints(data) {
    let count = 0;
    const countObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) countObject(obj[key]);
        else count++;
      }
    };
    countObject(data);
    return count;
  }

  async getDashboardMetrics(theaterId, period = "today") {
    const { startDate, endDate } = this.getPeriodDates(period);
    const [revenue, attendance, satisfaction] = await Promise.all([
      this.getRevenueData({ startDate, endDate, theater: theaterId }),
      this.getAttendanceData({ startDate, endDate, theater: theaterId }),
      this.getCustomerSatisfaction({ startDate, endDate }),
    ]);
    return { revenue, attendance, satisfaction, period, generatedAt: new Date() };
  }

  getPeriodDates(period) {
    const now = new Date();
    let startDate,
      endDate = now;
    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    return { startDate, endDate };
  }

  async getProductSalesStats({ year = 2025, theater }) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // 1. Query Data
    const baseQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
    };
    if (theater) baseQuery.theater = theater;

    // Separate queries because of different models
    const bookingQuery = { ...baseQuery, status: "Hoàn tất" };
    const transactionQuery = { ...baseQuery, status: "completed", transactionType: "concession" };

    const [bookings, transactions] = await Promise.all([
      Booking.find(bookingQuery).select("createdAt products totalPrice"), 
      CounterTransaction.find(transactionQuery).select("createdAt products totalAmount")
    ]);

    // 2. Initialize 12 months
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      quantity: 0,
      revenue: 0
    }));

    // 3. Helper to aggregate
    const aggregate = (items) => {
      items.forEach(item => {
        const month = new Date(item.createdAt).getMonth(); // 0-11
        
        // Sum from products array
        let itemQuantity = 0;
        let itemRevenue = 0;

        if (item.products && item.products.length > 0) {
            item.products.forEach(p => {
                const qty = p.quantity || 0;
                // Price priority: priceAtBooking -> price (legacy) -> 0
                const price = p.priceAtBooking || p.price || 0; 
                itemQuantity += qty;
                itemRevenue += price * qty;
            });
        }
        
        monthlyStats[month].quantity += itemQuantity;
        monthlyStats[month].revenue += itemRevenue;
      });
    };

    aggregate(bookings);
    aggregate(transactions);

    // 4. Format Response
    const monthsData = monthlyStats.map(stat => ({
      tenThang: `Tháng ${stat.month}`,
      values: [
        {
          name: "Doanh thu (Triệu VNĐ)",
          value: parseFloat((stat.revenue / 1000000).toFixed(2)) // Convert to Million
        },
        {
          name: "Số lượng bán",
          value: stat.quantity
        }
      ]
    }));

    return {
      title: "Thống kê sản phẩm",
      subTitle: "Thống kê theo từng tháng (Tổng hợp)",
      year: parseInt(year),
      months: monthsData
    };
  }
}

export default new AnalyticsService();
