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
                const exists = await Movie.findOne({ tmdbId: m.id });

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
                    let directorName = "Đang cập nhật";
                    let actorsArray = [];

                    try {
                        const detailRes = await axios.get(
                            `${BASE_URL}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=videos,credits`
                        );

                        const movieDetail = detailRes.data;

                        if (movieDetail.runtime && movieDetail.runtime > 0) {
                            realDuration = movieDetail.runtime;
                        }

                        if (movieDetail.credits) {
                            const directorObj = movieDetail.credits.crew.find(c => c.job === 'Director');
                            if (directorObj) {
                                directorName = directorObj.name;
                            }

                            const topCast = movieDetail.credits.cast.slice(0, 10).map(actor => actor.name);
                            if (topCast.length > 0) {
                                actorsArray = topCast;
                            }
                        }

                        const videos = movieDetail.videos?.results || [];
                        if (videos.length > 0) {
                            const selectedVideo =
                                videos.find(v => v.site === "YouTube" && v.type === "Trailer" && v.iso_639_1 === "vi") ||
                                videos.find(v => v.site === "YouTube" && v.type === "Trailer" && v.iso_639_1 === "en") ||
                                videos.find(v => v.site === "YouTube" && v.type === "Trailer") ||
                                videos.find(v => v.site === "YouTube" && v.type === "Teaser") ||
                                videos.find(v => v.site === "YouTube");

                            if (selectedVideo) {
                                trailerLink = `https://www.youtube.com/embed/${selectedVideo.key}`;
                            }
                        }
                    } catch (err) {
                        console.log(`⚠️ Lỗi lấy chi tiết/video/credits cho phim ${m.id}`);
                    }

                    // Lưu vào Database
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
                        director: directorName,
                        actors: actorsArray,
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