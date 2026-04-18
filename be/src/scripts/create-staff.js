import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model.js";

dotenv.config();

const createStaffAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" Connected to MongoDB");

    // Tạo tài khoản staff
    const staffData = {
      email: "staff@cinema.com",
      password: "staff123", // Will be hashed by pre-save hook
      fullName: "Nhân viên Cinema",
      username: "staff_cinema",
      phoneNumber: "0987654321",
      role: "staff",
      authProvider: "local",
      isActive: true,
    };

    // Kiểm tra xem staff đã tồn tại chưa
    const existingStaff = await User.findOne({ email: staffData.email });
    if (existingStaff) {
      console.log("  Staff account already exists");
      console.log("Email:", existingStaff.email);
      console.log("Role:", existingStaff.role);
      await mongoose.connection.close();
      return;
    }

    // Tạo staff mới
    const staff = new User(staffData);
    await staff.save();

    console.log("\n Staff account created successfully!");
    console.log("==========================================");
    console.log("Email:", staffData.email);
    console.log("Password:", staffData.password);
    console.log("Role:", staffData.role);
    console.log("==========================================");
    console.log("\nBạn có thể đăng nhập với:");
    console.log("POST /api/auth/login");
    console.log(
      JSON.stringify(
        {
          email: staffData.email,
          password: staffData.password,
        },
        null,
        2
      )
    );

    await mongoose.connection.close();
    console.log("\n Database connection closed");
  } catch (error) {
    console.error(" Error creating staff account:", error);
    process.exit(1);
  }
};

createStaffAccount();
