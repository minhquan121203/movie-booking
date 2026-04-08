import axios from "axios";
import Movie from "../models/movie.model.js";
import Genre from "../models/genre.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const syncTMDB = async (req, res) => {
    try {
        console.log("🚀 BẮT ĐẦU ĐỒNG BỘ TỪ TMDB...");

        // ĐỒNG BỘ THỂ LOẠI (GENRES)
        const genreRes = await axios.get(`${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=vi-VN`);
        const tmdbGenres = genreRes.data.genres;
        const genreMap = {};

        for (let g of tmdbGenres) {
            let genreDoc = await Genre.findOne({ name: g.name });
            if (!genreDoc) {
                // Tạo thể loại mới
                genreDoc = await Genre.create({
                    name: g.name,
                    description: `Thể loại ${g.name} từ TMDB`,
                    isActive: true
                });
            }
            genreMap[g.id] = genreDoc._id;
        }
        console.log(`✅ Đã đồng bộ xong Thể loại!`);

        // ĐỒNG BỘ PHIM (MOVIES)
        const movieRes = await axios.get(`${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=vi-VN&page=1`);
        const movies = movieRes.data.results;
        let addedCount = 0;

        for (let m of movies) {
            const exists = await Movie.findOne({ tmdbId: m.id });

            if (!exists) {
                const detailRes = await axios.get(`${BASE_URL}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=credits`);
                const details = detailRes.data;

                const director = details.credits.crew.find(c => c.job === "Director")?.name || "Đang cập nhật";
                const actors = details.credits.cast.slice(0, 5).map(a => a.name);
                const movieGenres = m.genre_ids.map(id => genreMap[id]).filter(Boolean);

                await Movie.create({
                    tmdbId: m.id,
                    title: m.title,
                    description: m.overview || "Đang cập nhật mô tả...",
                    posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w780${m.poster_path}` : "",
                    director: director,
                    actors: actors,
                    duration: details.runtime > 0 ? details.runtime : 120,
                    releaseDate: m.release_date || new Date(),
                    genres: movieGenres,
                    rating: "C13",
                    status: "Sắp chiếu",
                    language: "Tiếng Anh",
                    country: "Mỹ",
                    createdBy: req.userId
                });
                addedCount++;
            }
        }

        return successResponse(res, { addedCount }, `Húp thành công! Đã thêm ${addedCount} phim mới.`);

    } catch (error) {
        console.error("❌ Lỗi đồng bộ TMDB:", error.message);
        return errorResponse(res, "Lỗi khi đồng bộ dữ liệu từ TMDB", 500);
    }
};

export default { syncTMDB };