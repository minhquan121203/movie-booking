import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";
import StaffKPI from "./src/models/staff-kpi.model.js";
import Theater from "./src/models/theater.model.js";

dotenv.config();

const generateKPIs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const staffMembers = await User.find({ role: "staff" });
    console.log(`Found ${staffMembers.length} staff members.`);

    const theater = await Theater.findOne(); // just get one theater
    if (!theater) {
        console.log("No theater found!");
        process.exit(1);
    }

    const year = 2026;
    const month = 6;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    for (const staff of staffMembers) {
      // Check if exists
      let kpi = await StaffKPI.findOne({
        staff: staff._id,
        period: "monthly",
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      });

      if (!kpi) {
        kpi = new StaffKPI({
          period: "monthly",
          startDate,
          endDate,
          staff: staff._id,
          staffName: staff.fullName,
          position: "Nhân viên bán vé",
          theater: theater._id,
          theaterName: theater.name,
          sales: {
            revenueAchievement: Math.floor(Math.random() * 40) + 60, // 60-100
          },
          customerService: {
            customerSatisfactionScore: Math.random() * 1 + 4, // 4-5 -> *20 = 80-100
          },
          operational: {
            validationAccuracy: Math.floor(Math.random() * 20) + 80, // 80-100
          },
          attendance: {
            onTimeRate: Math.floor(Math.random() * 10) + 90, // 90-100
          },
          quality: {
            qualityScore: Math.floor(Math.random() * 15) + 85, // 85-100
          },
          status: "completed"
        });

        await kpi.save();
        console.log(`Created dummy KPI for ${staff.fullName}`);
      } else {
        kpi.sales.revenueAchievement = Math.floor(Math.random() * 40) + 60;
        kpi.customerService.customerSatisfactionScore = Math.random() * 1 + 4;
        kpi.operational.validationAccuracy = Math.floor(Math.random() * 20) + 80;
        kpi.attendance.onTimeRate = Math.floor(Math.random() * 10) + 90;
        kpi.quality.qualityScore = Math.floor(Math.random() * 15) + 85;
        kpi.status = "completed";
        await kpi.save();
        console.log(`Updated dummy KPI for ${staff.fullName}`);
      }
    }

    console.log("Done generating KPIs!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

generateKPIs();
