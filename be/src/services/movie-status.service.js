import cron from 'node-cron';
import Movie from '../models/movie.model.js';

const movieStatusService = {
    start: () => {
        cron.schedule('1 0 * * *', async () => {
            console.log("⏰ [CRON JOB] Đang kiểm tra ngày phát hành phim...");

            try {
                const now = new Date();
                const result = await Movie.updateMany(
                    {
                        status: "Sắp chiếu",
                        releaseDate: { $lte: now }
                    },
                    { $set: { status: "Đang chiếu" } }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ [CRON JOB] Đã lật trạng thái ${result.modifiedCount} phim sang Đang chiếu!`);
                }
            } catch (error) {
                console.error("❌ Lỗi Cron Job cập nhật trạng thái phim:", error);
            }
        });

        console.log("🎬 Movie Status Updater service started");
    }
};

export default movieStatusService;