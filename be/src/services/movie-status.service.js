import cron from 'node-cron';
import Movie from '../models/movie.model.js';
import { autoSyncTMDB } from '../controllers/tmdb.controller.js';

const movieStatusService = {
    start: () => {
        cron.schedule('*/2 * * * *', async () => {
            console.log("==========================================");
            console.log("⏰ [CRON JOB 00:00] BẮT ĐẦU DỌN DẸP & CẬP NHẬT HỆ THỐNG");
            console.log("==========================================");

            try {
                const now = new Date();
                const twoMonthsAgo = new Date();
                twoMonthsAgo.setMonth(now.getMonth() - 2);

                const startShowing = await Movie.updateMany(
                    { status: "Sắp chiếu", releaseDate: { $lte: now } },
                    { $set: { status: "Đang chiếu" } }
                );
                if (startShowing.modifiedCount > 0) console.log(`✅ Đã đưa ${startShowing.modifiedCount} phim ra rạp!`);

                const stopShowing = await Movie.updateMany(
                    { status: "Đang chiếu", releaseDate: { $lte: twoMonthsAgo } },
                    { $set: { status: "Ngừng chiếu" } }
                );
                if (stopShowing.modifiedCount > 0) console.log(`❌ Đã cất kho ${stopShowing.modifiedCount} phim!`);

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