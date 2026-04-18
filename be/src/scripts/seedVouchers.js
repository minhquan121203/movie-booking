import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/db.js";
import Voucher from "../models/voucher.model.js";

const seedVouchers = async () => {
  await connectDB();
  console.log("🚀 Importing Vouchers...");

  await Voucher.deleteMany();

  const vouchers = [];

  for (let i = 1; i <= 20; i++) {
    vouchers.push({
      code: `DISCOUNT${i}`,
      description: `Giảm giá tự động ${i}`,
      discountType: i % 2 === 0 ? "percent" : "fixed",
      discountValue: i % 2 === 0 ? 10 + i : 20000 + i * 500,
      minOrderValue: 50000,
      maxDiscountAmount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      maxUsagePerUser: 1,
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    });
  }

  const created = await Voucher.insertMany(vouchers);

  console.log(`🎉 Imported ${created.length} vouchers`);
  process.exit();
};

seedVouchers();
