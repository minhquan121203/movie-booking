import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cinema Booking API",
      version: "1.0.0",
      description: "API documentation for Cinema Ticket Booking System",
      contact: {
        name: "API Support",
        email: "support@cinema.com",
      },
    },
    servers: [
      {
        url: "https://movie-booking-api-bcfe.onrender.com/api",
        description: "Production Server (Render)"
      },
      {
        url: "http://localhost:5000/api",
        description: "Local Server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
    },
    tags: [
      { name: "Authentication", description: "Authentication endpoints" },
      { name: "Movies", description: "Movie management" },
      { name: "Schedules", description: "Schedule management" },
      { name: "Bookings", description: "Booking management" },
      { name: "Theaters", description: "Theater management" },
      { name: "Genres", description: "Genre management" },
      { name: "Reviews", description: "Review management" },
      { name: "Users", description: "User management" },
      { name: "Products", description: "Product management" },
      { name: "Vouchers", description: "Voucher management" },
      { name: "Payment", description: "Payment processing" },
      { name: "Upload", description: "File upload" },
      { name: "Admin", description: "Admin operations" },
      { name: "Staff", description: "Staff profile và operations" },
      { name: "Counter Booking", description: "Đặt vé tại quầy (Staff)" },
      { name: "Ticket Validation", description: "Validate và check-in vé (Staff)" },
      { name: "Customer Support", description: "Complaints và incidents management (Staff)" },
      { name: "Staff Reports", description: "Daily reports management (Staff)" },
      { name: "QR Scanner", description: "QR code scanning và check-in management" },
      { name: "Shift Management", description: "Quản lý ca làm việc và chuyên cần nhân viên" },
      { name: "Analytics", description: "Phân tích và báo cáo dữ liệu kinh doanh" },
      { name: "Performance Metrics", description: "Tracking và đánh giá hiệu suất (KPI)" },
      { name: "Dashboard", description: "Dashboard" },
      { name: "AI Chat", description: "Tư vấn viên AI (Gemini)" },
      { name: "Loyalty", description: "Hệ thống tích điểm & đổi điểm thành viên" },
    ],
  },
  apis: ["./src/docs/*.swagger.js"],
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };
