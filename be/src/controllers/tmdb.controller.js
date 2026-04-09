import axios from "axios";
import Movie from "../models/movie.model.js";
import Genre from "../models/genre.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const syncTMDB = async (req, res) => {
    try {
        let totalAddedCount = 0;
        const categories = ["now_playing", "upcoming"];

        for (const category of categories) {
            console.log(`Đang cào danh mục: ${category}...`);

            const movieRes = await axios.get(
                `${BASE_URL}/movie/${category}?api_key=${TMDB_API_KEY}&language=vi-VN&page=1`
            );
            const movies = movieRes.data.results;

            for (const m of movies) {
                // Kiểm tra xem phim đã có trong DB chưa
                const exists = await Movie.findOne({ tmdbId: m.id });

                if (!exists) {
                    let realDuration = 90;
                    try {
                        const detailRes = await axios.get(
                            `${BASE_URL}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=vi-VN`
                        );
                        if (detailRes.data.runtime && detailRes.data.runtime > 0) {
                            realDuration = detailRes.data.runtime;
                        }
                    } catch (err) {
                        console.log(`⚠️ Không lấy được chi tiết phim ${m.id}, dùng mặc định 120 phút.`);
                    }

                    const releaseDateObj = new Date(m.release_date || new Date());
                    const now = new Date();
                    const currentStatus = releaseDateObj <= now ? "Đang chiếu" : "Sắp chiếu";

                    await Movie.create({
                        title: m.title || m.original_title,
                        tmdbId: m.id,
                        description: m.overview,
                        posterUrl: m.poster_path
                            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                            : "https://via.placeholder.com/500x750?text=No+Poster",
                        releaseDate: releaseDateObj,
                        status: currentStatus,
                        country: "Hoa Kỳ",
                        duration: realDuration,
                        language: "Tiếng Anh",
                        rating: "C13",
                    });

                    totalAddedCount++;
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Húp trọn ổ thành công! Đã thêm ${totalAddedCount} phim mới từ cả 2 danh mục.`,
            data: {
                addedCount: totalAddedCount
            }
        });

    } catch (error) {
        console.error("❌ Lỗi đồng bộ TMDB:", error);
        return res.status(500).json({ message: "Lỗi server khi đồng bộ" });
    }
};

export default { syncTMDB };