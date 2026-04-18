import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model.js";

dotenv.config();

const createAllAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" Connected to MongoDB\n");

    const accounts = [
      {
        email: "customer@cinema.com",
        password: "customer123",
        fullName: "Khách hàng Cinema",
        username: "customer_cinema",
        phoneNumber: "0901234567",
        role: "customer",
        authProvider: "local",
        isActive: true,
      },
      {
        email: "staff@cinema.com",
        password: "staff123",
        fullName: "Nhân viên Cinema",
        username: "staff_cinema",
        phoneNumber: "0987654321",
        role: "staff",
        authProvider: "local",
        isActive: true,
      },
      {
        email: "admin@cinema.com",
        password: "admin123",
        fullName: "Admin Cinema",
        username: "admin_cinema",
        phoneNumber: "0923456789",
        role: "admin",
        authProvider: "local",
        isActive: true,
      },
      {
        email: "superadmin@cinema.com",
        password: "superadmin123",
        fullName: "Super Admin Cinema",
        username: "superadmin_cinema",
        phoneNumber: "0934567890",
        role: "super-admin",
        authProvider: "local",
        isActive: true,
      },
    ];

    console.log("🔄 Creating accounts...\n");

    for (const accountData of accounts) {
      // Kiểm tra xem tài khoản đã tồn tại chưa
      const existing = await User.findOne({ email: accountData.email });

      if (existing) {
        console.log(`  ${accountData.role.toUpperCase()} already exists: ${accountData.email}`);
        continue;
      }

      // Tạo tài khoản mới
      const user = new User(accountData);
      await user.save();

      console.log(` ${accountData.role.toUpperCase()} created successfully!`);
      console.log(`   Email: ${accountData.email}`);
      console.log(`   Password: ${accountData.password}`);
      console.log(`   Role: ${accountData.role}\n`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY - TẤT CẢ TÀI KHOẢN");
    console.log("=".repeat(60));

    console.log("\n1️⃣  CUSTOMER (Khách hàng)");
    console.log("   Email: customer@cinema.com");
    console.log("   Password: customer123");
    console.log("   Quyền: Đặt vé, xem phim, đánh giá, quản lý booking cá nhân");

    console.log("\n2️⃣  STAFF (Nhân viên)");
    console.log("   Email: staff@cinema.com");
    console.log("   Password: staff123");
    console.log("   Quyền: Bán vé tại quầy, kiểm vé, quét QR, hỗ trợ khách hàng");

    console.log("\n3️⃣  MANAGER (Quản lý)");
    console.log("   Email: manager@cinema.com");
    console.log("   Password: manager123");
    console.log("   Quyền: Quản lý ca làm, báo cáo, phân tích, KPI + tất cả quyền Staff");

    console.log("\n4️⃣  ADMIN (Quản trị viên)");
    console.log("   Email: admin@cinema.com");
    console.log("   Password: admin123");
    console.log("   Quyền: Quản lý phim, rạp, lịch chiếu, sản phẩm, voucher + tất cả quyền Manager");

    console.log("\n5️⃣  SUPER-ADMIN (Quản trị cấp cao)");
    console.log("   Email: superadmin@cinema.com");
    console.log("   Password: superadmin123");
    console.log("   Quyền: Quản lý user, thay đổi role + tất cả quyền Admin");

    console.log("\n" + "=".repeat(60));
    console.log("\n Đăng nhập bằng:");
    console.log("POST /api/auth/login");
    console.log(
      JSON.stringify(
        {
          email: "customer@cinema.com",
          password: "customer123",
        },
        null,
        2
      )
    );
    console.log("\n" + "=".repeat(60));

    await mongoose.connection.close();
    console.log("\n Database connection closed");
  } catch (error) {
    console.error(" Error creating accounts:", error);
    process.exit(1);
  }
};

createAllAccounts();
