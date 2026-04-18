import cron from 'node-cron';
import Movie from '../models/movie.model.js';
import { autoSyncTMDB } from '../controllers/movie.controller.js';

const movieStatusService = {
    start: () => {
        // Chạy vào lúc 00:00 mỗi đêm
        cron.schedule('0 0 * * *', async () => {
            console.log("==========================================");
            console.log("⏰ [CRON JOB 00:00] BẮT ĐẦU DỌN DẸP & CẬP NHẬT HỆ THỐNG");
            console.log("==========================================");

            try {
                const now = new Date();

                // Tính toán mốc thời gian 2 tháng trước (Khoảng 60 ngày)
                const twoMonthsAgo = new Date();
                twoMonthsAgo.setMonth(now.getMonth() - 2);

                // SẮP CHIẾU -> ĐANG CHIẾU
                const startShowing = await Movie.updateMany(
                    {
                        status: "Sắp chiếu",
                        releaseDate: { $lte: now }
                    },
                    { $set: { status: "Đang chiếu" } }
                );

                if (startShowing.modifiedCount > 0) {
                    console.log(`✅ [CRON JOB] Đã đưa ${startShowing.modifiedCount} phim ra rạp (Đang chiếu)!`);
                }

                // ĐANG CHIẾU -> NGỪNG CHIẾU
                const stopShowing = await Movie.updateMany(
                    {
                        status: "Đang chiếu",
                        releaseDate: { $lte: twoMonthsAgo }
                    },
                    { $set: { status: "Ngừng chiếu" } }
                );

                if (stopShowing.modifiedCount > 0) {
                    console.log(`❌ [CRON JOB] Đã cất kho ${stopShowing.modifiedCount} phim quá hạn 2 tháng (Ngừng chiếu)!`);
                }

                if (startShowing.modifiedCount === 0 && stopShowing.modifiedCount === 0) {
                    console.log("💤 [CRON JOB] Hôm nay không có phim nào cần đổi trạng thái.");
                }

                // GỌI ROBOT ĐI CÀO PHIM TMDB
                console.log("🤖 Đang gọi Robot đi cào phim TMDB...");
                await autoSyncTMDB();
                console.log("🏁 [CRON JOB] HOÀN TẤT TOÀN BỘ CÔNG VIỆC ĐÊM NAY!");

            } catch (error) {
                console.error("❌ Lỗi Cron Job cập nhật trạng thái phim:", error);
            }
        });

        console.log("🎬 Movie Status Updater (Vòng đời phim & Đồng bộ TMDB) started!");
    }
};

export default movieStatusService;