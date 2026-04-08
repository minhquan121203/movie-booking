import cron from 'node-cron';
import Movie from '../models/movie.model.js';

const movieStatusService = {
    start: () => {
        // Chạy vào lúc 00:00 mỗi đêm
        cron.schedule('0 0 * * *', async () => {
            console.log("⏰ [CRON JOB] Đang quét hệ thống để cập nhật vòng đời phim...");

            try {
                const now = new Date();

                // Tính toán mốc thời gian 2 tháng trước (Khoảng 60 ngày)
                const twoMonthsAgo = new Date();
                twoMonthsAgo.setMonth(now.getMonth() - 2);

                // SẮP CHIẾU -> ĐANG CHIẾU (Phim Sắp chiếu mà ngày phát hành <= hôm nay)
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

                // ĐANG CHIẾU -> NGỪNG CHIẾU (Phim Đang chiếu mà ngày phát hành <= 2 tháng trước)
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

            } catch (error) {
                console.error("❌ Lỗi Cron Job cập nhật trạng thái phim:", error);
            }
        });

        console.log("🎬 Movie Status Updater (Vòng đời phim 2 tháng) started!");
    }
};

export default movieStatusService;