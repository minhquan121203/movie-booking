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

                // Chuẩn bị sẵn Data
                const releaseDateObj = new Date(m.release_date || new Date());
                const now = new Date();
                const currentStatus = releaseDateObj <= now ? "Đang chiếu" : "Sắp chiếu";
                const posterLink = m.poster_path
                    ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                    : "https://via.placeholder.com/500x750?text=No+Poster";

                if (!exists) {
                    // PHIM HOÀN TOÀN MỚI
                    let realDuration = 90;
                    let trailerLink = "";
                    try {
                        const detailRes = await axios.get(
                            `${BASE_URL}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=videos&include_video_language=vi,en`
                        );

                        // Lấy thời lượng
                        if (detailRes.data.runtime && detailRes.data.runtime > 0) {
                            realDuration = detailRes.data.runtime;
                        }

                        if (detailRes.data.videos && detailRes.data.videos.results.length > 0) {
                            const videos = detailRes.data.videos.results;
                            const trailer = videos.find(v => v.site === "YouTube" && v.type === "Trailer")
                                || videos.find(v => v.site === "YouTube"); // Nếu không có type Trailer thì lấy bừa 1 video Youtube

                            if (trailer) {
                                trailerLink = `https://www.youtube.com/watch?v=${trailer.key}`;
                            }
                        }
                    } catch (err) {
                        console.log(`⚠️ Không lấy được chi tiết/trailer phim ${m.id}`);
                    }

                    await Movie.create({
                        title: m.title || m.original_title,
                        tmdbId: m.id,
                        description: m.overview,
                        posterUrl: posterLink,
                        trailerUrl: trailerLink,
                        releaseDate: releaseDateObj,
                        status: currentStatus,
                        country: "Hoa Kỳ",
                        duration: realDuration,
                        language: "Tiếng Anh",
                        rating: "C13",
                    });
                    totalAddedCount++;

                } else if (exists.isDeleted) {
                    // PHIM BỊ XÓA MỀM
                    exists.isDeleted = false;
                    exists.posterUrl = posterLink;
                    exists.status = currentStatus;
                    await exists.save();
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