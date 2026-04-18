import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Booking from "../models/booking.model.js";
import CounterTransaction from "../models/counter-transaction.model.js";
import Movie from "../models/movie.model.js";
import Review from "../models/review.model.js";
import Schedule from "../models/schedule.model.js";
import StaffKPI from "../models/staff-kpi.model.js";
import Theater from "../models/theater.model.js";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

const statisticsController = {
  // Tổng quan hệ thống
  getOverview: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Default: tháng hiện tại
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date();

      const [totalRevenue, totalBookings, totalCustomers, totalMovies, completedBookings, cancelledBookings] =
        await Promise.all([
          // Tổng doanh thu
          Booking.aggregate([
            {
              $match: {
                createdAt: { $gte: start, $lte: end },
                status: "Hoàn tất",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalAmount" },
              },
            },
          ]),

          // Tổng số booking
          Booking.countDocuments({
            createdAt: { $gte: start, $lte: end },
          }),

          // Tổng số khách hàng
          User.countDocuments({ role: "customer", isDeleted: { $ne: true } }),

          // Tổng số phim
          Movie.countDocuments({ isDeleted: { $ne: true } }),

          // Số booking hoàn tất
          Booking.countDocuments({
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          }),

          // Số booking bị hủy
          Booking.countDocuments({
            createdAt: { $gte: start, $lte: end },
            status: "Đã hủy",
          }),
        ]);

      // Tính % thay đổi so với kỳ trước
      const previousStart = new Date(start);
      previousStart.setMonth(previousStart.getMonth() - 1);
      const previousEnd = new Date(end);
      previousEnd.setMonth(previousEnd.getMonth() - 1);

      const previousRevenue = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStart, $lte: previousEnd },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]);

      const currentRevenue = totalRevenue[0]?.total || 0;
      const prevRevenue = previousRevenue[0]?.total || 0;
      const revenueChange = prevRevenue > 0 ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2) : 0;

      return successResponse(res, {
        overview: {
          totalRevenue: currentRevenue,
          revenueChange: parseFloat(revenueChange),
          totalBookings,
          completedBookings,
          cancelledBookings,
          successRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(2) : 0,
          totalCustomers,
          totalMovies,
        },
        period: {
          start,
          end,
        },
      });
    } catch (error) {
      console.error("Get overview error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Doanh thu theo thời gian
  getRevenue: async (req, res) => {
    try {
      const { startDate, endDate, groupBy = "day" } = req.query;

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      // Group by format
      let dateFormat;
      switch (groupBy) {
        case "hour":
          dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
          break;
        case "day":
          dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case "week":
          dateFormat = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
          break;
        case "month":
          dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        case "year":
          dateFormat = { $dateToString: { format: "%Y", date: "$createdAt" } };
          break;
        default:
          dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      }

      const revenueData = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: dateFormat,
            totalRevenue: { $sum: "$totalAmount" },
            ticketsRevenue: { $sum: "$ticketsAmount" },
            productsRevenue: { $sum: "$productsAmount" },
            totalBookings: { $sum: 1 },
            totalTickets: { $sum: { $size: "$seats" } },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Thống kê theo phương thức thanh toán
      const paymentMethods = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: "$paymentDetails.paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      return successResponse(res, {
        revenueByTime: revenueData,
        paymentMethods,
        summary: {
          totalRevenue: revenueData.reduce((sum, item) => sum + item.totalRevenue, 0),
          totalBookings: revenueData.reduce((sum, item) => sum + item.totalBookings, 0),
          totalTickets: revenueData.reduce((sum, item) => sum + item.totalTickets, 0),
          avgRevenuePerBooking:
            revenueData.length > 0
              ? (
                  revenueData.reduce((sum, item) => sum + item.totalRevenue, 0) /
                  revenueData.reduce((sum, item) => sum + item.totalBookings, 0)
                ).toFixed(2)
              : 0,
        },
      });
    } catch (error) {
      console.error("Get revenue error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Thống kê phim
  getMovieStats: async (req, res) => {
    try {
      const { startDate, endDate, limit = 10 } = req.query;

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      // Top phim theo doanh thu
      const topMoviesByRevenue = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: "$movieTitle",
            totalRevenue: { $sum: "$totalAmount" },
            totalBookings: { $sum: 1 },
            totalTickets: { $sum: { $size: "$seats" } },
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
        {
          $limit: parseInt(limit),
        },
      ]);

      // Top phim theo số vé bán
      const topMoviesByTickets = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: "$movieTitle",
            totalTickets: { $sum: { $size: "$seats" } },
            totalRevenue: { $sum: "$totalAmount" },
            totalBookings: { $sum: 1 },
          },
        },
        {
          $sort: { totalTickets: -1 },
        },
        {
          $limit: parseInt(limit),
        },
      ]);

      // Thống kê theo thể loại
      const genreStats = await Movie.aggregate([
        {
          $lookup: {
            from: "schedules",
            localField: "_id",
            foreignField: "movie",
            as: "schedules",
          },
        },
        {
          $unwind: "$schedules",
        },
        {
          $lookup: {
            from: "bookings",
            localField: "schedules._id",
            foreignField: "schedule",
            as: "bookings",
          },
        },
        {
          $unwind: {
            path: "$bookings",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "bookings.createdAt": { $gte: start, $lte: end },
            "bookings.status": "Hoàn tất",
          },
        },
        {
          $unwind: "$genres",
        },
        {
          $lookup: {
            from: "genres",
            localField: "genres",
            foreignField: "_id",
            as: "genreInfo",
          },
        },
        {
          $unwind: "$genreInfo",
        },
        {
          $group: {
            _id: "$genreInfo.name",
            totalRevenue: { $sum: "$bookings.totalAmount" },
            totalBookings: { $sum: 1 },
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
      ]);

      // Tỷ lệ lấp đầy phòng chiếu
      const occupancyRate = await Schedule.aggregate([
        {
          $match: {
            showDate: { $gte: start, $lte: end },
            status: { $in: ["Đang mở bán vé", "Sắp đầy", "Hết vé", "Đã chiếu"] },
          },
        },
        {
          $group: {
            _id: null,
            avgOccupancy: {
              $avg: {
                $multiply: [{ $divide: ["$bookedSeatsCount", "$totalSeats"] }, 100],
              },
            },
            totalSeats: { $sum: "$totalSeats" },
            bookedSeats: { $sum: "$bookedSeatsCount" },
          },
        },
      ]);

      return successResponse(res, {
        topMoviesByRevenue,
        topMoviesByTickets,
        genreStats,
        occupancyRate: occupancyRate[0] || {
          avgOccupancy: 0,
          totalSeats: 0,
          bookedSeats: 0,
        },
      });
    } catch (error) {
      console.error("Get movie stats error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Thống kê khách hàng
  getCustomerStats: async (req, res) => {
    try {
      const { startDate, endDate, limit = 10 } = req.query;

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      // Top khách hàng theo doanh thu
      const topCustomers = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: "$customer",
            totalSpent: { $sum: "$totalAmount" },
            totalBookings: { $sum: 1 },
            totalTickets: { $sum: { $size: "$seats" } },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $unwind: "$customerInfo",
        },
        {
          $project: {
            _id: 1,
            fullName: "$customerInfo.fullName",
            email: "$customerInfo.email",
            membershipLevel: "$customerInfo.membershipLevel",
            totalSpent: 1,
            totalBookings: 1,
            totalTickets: 1,
          },
        },
        {
          $sort: { totalSpent: -1 },
        },
        {
          $limit: parseInt(limit),
        },
      ]);

      // Khách hàng mới
      const newCustomers = await User.countDocuments({
        role: "customer",
        createdAt: { $gte: start, $lte: end },
      });

      // Phân bố theo membership level
      const membershipDistribution = await User.aggregate([
        {
          $match: { role: "customer" },
        },
        {
          $group: {
            _id: "$membershipLevel",
            count: { $sum: 1 },
          },
        },
      ]);

      return successResponse(res, {
        topCustomers,
        newCustomers,
        membershipDistribution,
      });
    } catch (error) {
      console.error("Get customer stats error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Thống kê theo rạp
  getTheaterStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      const theaterStats = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "Hoàn tất",
          },
        },
        {
          $group: {
            _id: "$theaterName",
            totalRevenue: { $sum: "$totalAmount" },
            totalBookings: { $sum: 1 },
            totalTickets: { $sum: { $size: "$seats" } },
            avgRevenuePerBooking: { $avg: "$totalAmount" },
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
      ]);

      return successResponse(res, theaterStats);
    } catch (error) {
      console.error("Get theater stats error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // Export báo cáo
  exportReport: async (req, res) => {
    try {
      const { type, startDate, endDate, format = "excel" } = req.query;

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      // Get data based on type
      let data = [];
      let filename = "";
      let title = "";

      if (type === "revenue" || !type) {
        const bookings = await Booking.find({
          createdAt: { $gte: start, $lte: end },
          status: "Hoàn tất",
        })
          .populate("customer", "fullName email")
          .populate("schedule", "movie showDate")
          .lean();

        data = bookings.map((b) => ({
          "Mã đặt vé": b.bookingCode,
          "Khách hàng": b.customer?.fullName || "N/A",
          Email: b.customer?.email || "N/A",
          Phim: b.movieTitle,
          Rạp: b.theaterName,
          "Ngày chiếu": b.showDate?.toISOString().split("T")[0] || "N/A",
          "Số ghế": b.seats?.length || 0,
          "Tổng tiền": b.totalAmount,
          "Ngày đặt": b.createdAt.toISOString().split("T")[0],
        }));

        title = "Báo cáo doanh thu";
        filename = `revenue_${start.toISOString().split("T")[0]}_${end.toISOString().split("T")[0]}`;
      } else if (type === "bookings") {
        const bookings = await Booking.find({
          createdAt: { $gte: start, $lte: end },
        })
          .populate("customer", "fullName email")
          .lean();

        data = bookings.map((b) => ({
          "Mã đặt vé": b.bookingCode,
          "Khách hàng": b.customer?.fullName || "N/A",
          "Trạng thái": b.status,
          "Tổng tiền": b.totalAmount,
          "Ngày đặt": b.createdAt.toISOString().split("T")[0],
        }));

        title = "Báo cáo đặt vé";
        filename = `bookings_${start.toISOString().split("T")[0]}_${end.toISOString().split("T")[0]}`;
      } else if (type === "customers") {
        //  FIX: Extract customer stats logic directly instead of calling controller method
        const topCustomers = await Booking.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              status: "Hoàn tất",
            },
          },
          {
            $group: {
              _id: "$customer",
              totalSpent: { $sum: "$totalAmount" },
              totalBookings: { $sum: 1 },
              totalTickets: { $sum: { $size: "$seats" } },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "customerInfo",
            },
          },
          {
            $unwind: "$customerInfo",
          },
          {
            $project: {
              _id: 1,
              fullName: "$customerInfo.fullName",
              email: "$customerInfo.email",
              membershipLevel: "$customerInfo.membershipLevel",
              totalSpent: 1,
              totalBookings: 1,
              totalTickets: 1,
            },
          },
          {
            $sort: { totalSpent: -1 },
          },
          {
            $limit: 100,
          },
        ]);

        data = topCustomers.map((c) => ({
          Tên: c.fullName || "N/A",
          Email: c.email || "N/A",
          "Hạng thành viên": c.membershipLevel || "Bạc",
          "Tổng chi tiêu": c.totalSpent || 0,
          "Số đơn": c.totalBookings || 0,
          "Số vé": c.totalTickets || 0,
        }));

        title = "Báo cáo khách hàng";
        filename = `customers_${start.toISOString().split("T")[0]}_${end.toISOString().split("T")[0]}`;
      }

      //  FIX: Export to Excel or PDF
      if (format === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(title);

        // Add header
        if (data.length > 0) {
          worksheet.columns = Object.keys(data[0]).map((key) => ({
            header: key,
            key: key,
            width: 20,
          }));

          // Add data
          data.forEach((row) => {
            worksheet.addRow(row);
          });

          // Style header
          worksheet.getRow(1).font = { bold: true };
          worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        }

        // Set headers
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
      } else if (format === "pdf") {
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
        doc.pipe(res);

        // Add title
        doc.fontSize(20).text(title, { align: "center" });
        doc.moveDown();

        // Add date range
        doc.fontSize(12).text(`Từ: ${start.toLocaleDateString("vi-VN")} đến ${end.toLocaleDateString("vi-VN")}`, {
          align: "center",
        });
        doc.moveDown(2);

        // Add table
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const colWidth = 500 / headers.length;

          // Headers
          doc.fontSize(10).font("Helvetica-Bold");
          let x = 50;
          headers.forEach((header) => {
            doc.text(header, x, doc.y, { width: colWidth });
            x += colWidth;
          });
          doc.moveDown();

          // Data
          doc.font("Helvetica");
          data.forEach((row, index) => {
            if (doc.y > 700) {
              doc.addPage();
            }
            x = 50;
            headers.forEach((header) => {
              doc.text(String(row[header] || ""), x, doc.y, { width: colWidth });
              x += colWidth;
            });
            doc.moveDown();
          });
        }

        doc.end();
      } else {
        return successResponse(res, data, "Export thành công", 200);
      }
    } catch (error) {
      console.error("Export report error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  //------------------- FIXED CONTROLLERS BELOW ------------------//
  //  Dashboard Summary Overview
  getSummaryOverview: async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // 1. Tổng số tài khoản & 2. Số lượng phim & 3. Số rạp (GIỮ NGUYÊN)
      const [totalAccounts, newAccountsThisMonth] = await Promise.all([
        User.countDocuments({ isDeleted: { $ne: true } }),
        User.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
      ]);

      const [totalMovies, newMoviesThisMonth] = await Promise.all([
        Movie.countDocuments({ isDeleted: { $ne: true } }),
        Movie.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
      ]);

      const [totalTheaters, newTheatersThisMonth] = await Promise.all([
        Theater.countDocuments({ isDeleted: { $ne: true } }),
        Theater.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
      ]);

      const calcStats = async (startDate, endDate) => {
        const stats = await Booking.aggregate([
          // 1. Lấy dữ liệu Online
          {
            $match: {
              status: "Hoàn tất",
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $project: {
              seatsCount: { $size: "$seats" },
              revenue: "$totalAmount",
            },
          },
          // 2. Gộp dữ liệu Offline (Tại quầy)
          {
            $unionWith: {
              coll: "countertransactions",
              pipeline: [
                {
                  $match: {
                    status: "completed",
                    createdAt: { $gte: startDate, $lte: endDate },
                  },
                },
                {
                  $project: {
                    seatsCount: { $size: "$seats" },
                    revenue: "$totalAmount",
                  },
                },
              ],
            },
          },
          // 3. Tính tổng
          {
            $group: {
              _id: null,
              totalTickets: { $sum: "$seatsCount" },
              totalRevenue: { $sum: "$revenue" },
            },
          },
        ]);
        return stats[0] || { totalTickets: 0, totalRevenue: 0 };
      };

      // Chạy song song cho tháng này và tháng trước
      const [statsThisMonth, statsLastMonth] = await Promise.all([
        calcStats(startOfMonth, endOfMonth),
        calcStats(startOfLastMonth, endOfLastMonth),
      ]);

      // Tính toán vé
      const ticketsThisMonth = statsThisMonth.totalTickets;
      const ticketDiff = ticketsThisMonth - statsLastMonth.totalTickets;
      const ticketDiffSign = ticketDiff >= 0 ? "+" : "";

      // Tính toán doanh thu
      const revenueThisMonth = statsThisMonth.totalRevenue;
      const revenueLastMonth = statsLastMonth.totalRevenue;

      let revenueGrowth = 0;
      if (revenueLastMonth > 0) {
        revenueGrowth = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
      } else if (revenueThisMonth > 0) {
        revenueGrowth = 100;
      }
      const revenueGrowthSign = revenueGrowth >= 0 ? "+" : "";

      const cards = [
        {
          title: "Tổng số tài khoản",
          value: totalAccounts,
          subLabel: `+${newAccountsThisMonth} tài khoản mới`,
          description: "tài khoản mới trong tháng",
        },
        {
          title: "Số lượng phim",
          value: totalMovies,
          subLabel: `+${newMoviesThisMonth} phim mới`,
          description: "phim mới trong tháng",
        },
        {
          title: "Số rạp",
          value: totalTheaters,
          subLabel: `+${newTheatersThisMonth} rạp mới`,
          description: "rạp mới trong tháng",
        },
        {
          title: "Số vé bán ra trong tháng",
          value: ticketsThisMonth,
          subLabel: `${ticketDiffSign}${ticketDiff} vé`,
          description: "so với tháng trước",
        },
        {
          title: "Doanh thu tháng",
          value: revenueThisMonth,
          subLabel: `${revenueGrowthSign}${revenueGrowth.toFixed(1)}%`,
          description: "so với tháng trước",
        },
      ];

      return successResponse(res, { cards });
    } catch (error) {
      console.error("Get summary overview error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Top 5 Movies
  getTopMovies: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const topMovies = await Booking.aggregate([
        // 1. Lọc Online
        {
          $match: {
            status: "Hoàn tất",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $project: {
            movieTitle: 1,
            ticketCount: { $size: "$seats" },
          },
        },
        // 2. Gộp Offline
        {
          $unionWith: {
            coll: "countertransactions",
            pipeline: [
              {
                $match: {
                  status: "completed",
                  createdAt: { $gte: startOfYear, $lte: endOfYear },
                },
              },
              {
                $project: {
                  movieTitle: 1,
                  ticketCount: { $size: "$seats" },
                },
              },
            ],
          },
        },
        // 3. Group và đếm
        {
          $group: {
            _id: "$movieTitle",
            totalTickets: { $sum: "$ticketCount" },
          },
        },
        { $sort: { totalTickets: -1 } },
        { $limit: 5 },
      ]);

      const items = topMovies.map((movie) => ({
        name: movie._id,
        value: movie.totalTickets,
      }));

      // Pad to 5 items
      while (items.length < 5) {
        items.push({ name: "Chưa có dữ liệu", value: 0 });
      }

      return successResponse(res, {
        title: "Top 5 Phim Xem Nhiều Nhất",
        subTitle: "Xếp hạng theo lượt xem (Online + Tại quầy)",
        year,
        items,
      });
    } catch (error) {
      console.error("Get top movies error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Top 5 Cinemas
  getTopCinemas: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const topCinemas = await Booking.aggregate([
        // 1. Lọc Online
        {
          $match: {
            status: "Hoàn tất",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $project: {
            theaterName: 1,
            amount: "$totalAmount",
          },
        },
        // 2. Gộp Offline
        {
          $unionWith: {
            coll: "countertransactions",
            pipeline: [
              {
                $match: {
                  status: "completed",
                  createdAt: { $gte: startOfYear, $lte: endOfYear },
                },
              },
              {
                $project: {
                  theaterName: 1,
                  amount: "$totalAmount",
                },
              },
            ],
          },
        },
        // 3. Group và tính tổng tiền
        {
          $group: {
            _id: "$theaterName",
            totalRevenue: { $sum: "$amount" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]);

      const items = topCinemas.map((cinema) => ({
        name: cinema._id,
        // Convert to Million VND
        value: parseFloat((cinema.totalRevenue / 1000000).toFixed(2)),
      }));

      while (items.length < 5) {
        items.push({ name: "Chưa có dữ liệu", value: 0 });
      }

      return successResponse(res, {
        title: "Top 5 Rạp Doanh Thu Cao Nhất",
        subTitle: "Đơn vị: Triệu VND (Online + Tại quầy)",
        year,
        items,
      });
    } catch (error) {
      console.error("Get top cinemas error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
  // FIX: Top 3 Employees (By Revenue)
  getTopEmployees: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const topEmployees = await CounterTransaction.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: "$staffName",
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 3 },
      ]);

      const items = topEmployees.map((emp) => ({
        name: emp._id,
        value: emp.totalRevenue,
      }));

      // Pad to 3 items
      while (items.length < 3) {
        items.push({ name: "Chưa có dữ liệu", value: 0 });
      }

      return successResponse(res, {
        title: "Top 3 Nhân Viên Xuất Sắc",
        subTitle: "Xếp hạng theo doanh thu bán hàng",
        year,
        items,
      });
    } catch (error) {
      console.error("Get top employees error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Top 3 Performance Movies (By Rating)
  getTopPerformanceMovies: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      // Note: Reviews are linked to movies. We aggregate reviews created in that year.
      const topMovies = await Review.aggregate([
        {
          $match: {
            status: "Đã duyệt", // Only counting approved reviews
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: "$movie",
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "movies",
            localField: "_id",
            foreignField: "_id",
            as: "movieInfo",
          },
        },
        { $unwind: "$movieInfo" },
        { $sort: { avgRating: -1, count: -1 } },
        { $limit: 3 },
      ]);

      const items = topMovies.map((m) => ({
        name: m.movieInfo.title,
        value: parseFloat(m.avgRating.toFixed(1)),
      }));

      // Pad to 3 items
      while (items.length < 3) {
        items.push({ name: "Chưa có dữ liệu", value: 0 });
      }

      return successResponse(res, {
        title: "Top 3 Phim Hiệu Suất Cao",
        subTitle: "Xếp hạng theo đánh giá trung bình",
        year,
        items,
      });
    } catch (error) {
      console.error("Get top performance movies error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Top 3 Effective Cinemas (By Occupancy Rate)
  getTopEffectiveCinemas: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const topCinemas = await Schedule.aggregate([
        {
          $match: {
            showDate: { $gte: startOfYear, $lte: endOfYear },
            status: "Đã chiếu",
          },
        },
        {
          $lookup: {
            from: "theaters",
            localField: "theater",
            foreignField: "_id",
            as: "theaterInfo",
          },
        },
        { $unwind: "$theaterInfo" },
        {
          $group: {
            _id: "$theaterInfo.name",
            totalSeats: { $sum: "$totalSeats" },
            bookedSeats: { $sum: "$bookedSeatsCount" },
          },
        },
        {
          $project: {
            name: "$_id",
            occupancyRate: {
              $cond: [
                { $eq: ["$totalSeats", 0] },
                0,
                { $multiply: [{ $divide: ["$bookedSeats", "$totalSeats"] }, 100] },
              ],
            },
          },
        },
        { $sort: { occupancyRate: -1 } },
        { $limit: 3 },
      ]);

      const items = topCinemas.map((c) => ({
        name: c.name,
        value: parseFloat(c.occupancyRate.toFixed(1)),
      }));

      // Pad to 3 items
      while (items.length < 3) {
        items.push({ name: "Chưa có dữ liệu", value: 0 });
      }

      return successResponse(res, {
        title: "Top 3 Rạp Hoạt Động Hiệu Quả",
        subTitle: "Xếp hạng theo tỷ lệ lấp đầy",
        year,
        items,
      });
    } catch (error) {
      console.error("Get top effective cinemas error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
  // FIX: Employee KPI
  getEmployeeKPI: async (req, res) => {
    try {
      const { employeeId } = req.query;
      if (!employeeId) {
        return errorResponse(res, "Employee ID is required", 400);
      }

      // Default to current month/year if not provided
      const now = new Date();
      const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();

      // Create start and end date for the query period (entire month)
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Try to find existing KPI record
      let kpi = await StaffKPI.findOne({
        staff: employeeId,
        period: "monthly",
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      }).populate("staff", "fullName email position");

      if (!kpi) {
        // Option: we could calculate on the fly, but for now just return empty state or 404.
        // Let's return a structured empty response so FE doesn't break.
        return successResponse(res, {
          period: "monthly",
          month,
          year,
          staffId: employeeId,
          message: "Chưa có dữ liệu KPI cho tháng này",
          kpiData: null,
        });
      }

      return successResponse(res, kpi);
    } catch (error) {
      console.error("Get employee KPI error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Performance Trend (Staff Score & Theater Efficiency)
  getPerformanceTrend: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      // 1. Staff Performance Trend (Average Monthly Score)
      const staffTrend = await StaffKPI.aggregate([
        {
          $match: {
            period: "monthly",
            startDate: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: { $month: "$startDate" },
            avgScore: { $avg: "$performance.overallScore" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // 2. Theater Efficiency Trend (Average Monthly Occupancy)
      // Using Schedule to calculate occupancy rate
      const theaterTrend = await Schedule.aggregate([
        {
          $match: {
            showDate: { $gte: startOfYear, $lte: endOfYear },
            status: "Đã chiếu",
          },
        },
        {
          $group: {
            _id: { $month: "$showDate" },
            totalSeats: { $sum: "$totalSeats" },
            bookedSeats: { $sum: "$bookedSeatsCount" },
          },
        },
        {
          $project: {
            _id: 1,
            occupancyRate: {
              $cond: [
                { $eq: ["$totalSeats", 0] },
                0,
                { $multiply: [{ $divide: ["$bookedSeats", "$totalSeats"] }, 100] },
              ],
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Construct Response 12 Months
      const monthsData = [];
      for (let i = 1; i <= 12; i++) {
        const staffMonth = staffTrend.find((m) => m._id === i);
        const theaterMonth = theaterTrend.find((m) => m._id === i);

        monthsData.push({
          tenThang: `Tháng ${i}`,
          values: [
            {
              name: "Hiệu suất nhân viên",
              value: staffMonth ? parseFloat(staffMonth.avgScore.toFixed(1)) : 0,
            },
            {
              name: "Hiệu suất rạp",
              value: theaterMonth ? parseFloat(theaterMonth.occupancyRate.toFixed(1)) : 0,
            },
          ],
        });
      }

      return successResponse(res, {
        title: "Xu Hướng Hiệu Suất",
        subTitle: "Theo dõi sự thay đổi theo thời gian",
        year,
        months: monthsData,
      });
    } catch (error) {
      console.error("Get performance trend error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Revenue and Views Trend
  getRevenueAndViews: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const stats = await Booking.aggregate([
        // 1. Lọc Online
        {
          $match: {
            status: "Hoàn tất",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $project: {
            month: { $month: "$createdAt" }, // Lấy tháng (1-12)
            revenue: "$totalAmount",
            views: { $size: "$seats" },
          },
        },
        // 2. Gộp Offline
        {
          $unionWith: {
            coll: "countertransactions",
            pipeline: [
              {
                $match: {
                  status: "completed",
                  createdAt: { $gte: startOfYear, $lte: endOfYear },
                },
              },
              {
                $project: {
                  month: { $month: "$createdAt" },
                  revenue: "$totalAmount",
                  views: { $size: "$seats" },
                },
              },
            ],
          },
        },
        // 3. Group theo tháng
        {
          $group: {
            _id: "$month",
            totalRevenue: { $sum: "$revenue" },
            totalViews: { $sum: "$views" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Construct Response 12 Months
      const monthsData = [];
      for (let i = 1; i <= 12; i++) {
        const stat = stats.find((m) => m._id === i);

        monthsData.push({
          tenThang: `Tháng ${i}`,
          values: [
            {
              name: "Doanh thu (Triệu VNĐ)",
              value: stat ? parseFloat((stat.totalRevenue / 1000000).toFixed(2)) : 0,
            },
            {
              name: "Lượt xem",
              value: stat ? stat.totalViews : 0,
            },
          ],
        });
      }

      return successResponse(res, {
        title: "Doanh thu & Lượt xem",
        subTitle: "Thống kê theo từng tháng (Tổng hợp)",
        year,
        months: monthsData,
      });
    } catch (error) {
      console.error("Get revenue and views error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  // FIX: Employee Comparison
  getPerformanceComparison: async (req, res) => {
    try {
      const { employeeIds, month, year } = req.query;

      if (!employeeIds) {
        return errorResponse(res, "Employee IDs are required", 400);
      }

      const ids = employeeIds.split(",").map((id) => id.trim());
      const queryYear = parseInt(year) || new Date().getFullYear();
      const queryMonth = parseInt(month) || new Date().getMonth() + 1;

      const startDate = new Date(queryYear, queryMonth - 1, 1);
      const endDate = new Date(queryYear, queryMonth, 0, 23, 59, 59, 999);

      const kpiData = await StaffKPI.find({
        staff: { $in: ids },
        period: "monthly",
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      }).populate("staff", "fullName");

      const kpiMap = new Map();
      kpiData.forEach((kpi) => {
        if (kpi.staff) kpiMap.set(kpi.staff._id.toString(), kpi);
      });

      // Normalize return data
      const comparison = await Promise.all(
        ids.map(async (id) => {
          const kpi = kpiMap.get(id);

          if (!kpi) {
            // Nếu không tìm thấy KPI, query lấy tên nhân viên để hiển thị (fallback)
            const user = await User.findById(id).select("fullName");
            return {
              staffId: id,
              staffName: user ? user.fullName : "Unknown",
              stats: { Sales: 0, Service: 0, Operations: 0, Attendance: 0, Quality: 0 },
              overallScore: 0,
            };
          }

          return {
            staffId: kpi.staff._id,
            staffName: kpi.staff.fullName,
            stats: {
              Sales: kpi.sales?.revenueAchievement || 0,
              Service: (kpi.customerService?.customerSatisfactionScore || 0) * 20,
              Operations: kpi.operational?.validationAccuracy || 0,
              Attendance: kpi.attendance?.onTimeRate || 0,
              Quality: kpi.quality?.qualityScore || 0,
            },
            overallScore: kpi.performance?.overallScore || 0,
          };
        })
      );

      return successResponse(res, {
        year: queryYear,
        month: queryMonth,
        comparison,
      });
    } catch (error) {
      console.error("Get performance comparison error:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  },
};

export default statisticsController;
