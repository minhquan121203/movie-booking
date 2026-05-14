import axios from "axios";
import Movie from "../models/movie.model.js";
import Genre from "../models/genre.model.js";
import { COUNTRY_MAP, LANGUAGE_MAP } from "../constants/location.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";


export const autoSyncTMDB = async () => {
    try {
        let newCount = 0;
        let updateCount = 0;
        const allMovies = new Set();

        // 🎭 Ưu tiên 1: Phim Việt Nam
        console.log("🇻🇳 [TMDB] Đang cào phim Việt Nam...");
        try {
            for (let page = 1; page <= 3; page++) {
                const vietnamRes = await axios.get(
                    `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&region=VN&with_original_language=vi&sort_by=release_date.desc&page=${page}`
                );
                vietnamRes.data.results.forEach(m => allMovies.add(m.id));
            }
        } catch (err) {
            console.warn("⚠️ Lỗi cào phim Việt Nam:", err.message);
        }

        // 🎬 Ưu tiên 2: Phim đang chiếu + Sắp chiếu (4 pages mỗi loại)
        const categories = [
            { name: "now_playing", pages: 4 },
            { name: "upcoming", pages: 3 },
            { name: "top_rated", pages: 2 },
            { name: "popular", pages: 2 },
        ];

        for (const cat of categories) {
            console.log(`🎬 [TMDB] Đang cào danh mục: ${cat.name}...`);
            for (let page = 1; page <= cat.pages; page++) {
                try {
                    const movieRes = await axios.get(
                        `${BASE_URL}/movie/${cat.name}?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`
                    );
                    movieRes.data.results.forEach(m => allMovies.add(m.id));
                } catch (err) {
                    console.warn(`⚠️ Lỗi cào ${cat.name} page ${page}:`, err.message);
                }
            }
        }

        console.log(`📊 Tổng cộng ${allMovies.size} phim cần xử lý...`);
        let processedCount = 0;

        // 🔄 Xử lý từng phim
        for (const movieId of allMovies) {
            try {
                const exists = await Movie.findOne({ tmdbId: movieId });

                // 📥 Lấy chi tiết phim từ TMDB
                const detailRes = await axios.get(
                    `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=videos,credits`
                );
                const m = detailRes.data;

                if (!m.title) continue;

                const releaseDateObj = new Date(m.release_date || new Date());
                const now = new Date();
                const currentStatus = releaseDateObj <= now ? "Đang chiếu" : "Sắp chiếu";
                const posterLink = m.poster_path
                    ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                    : "https://via.placeholder.com/500x750?text=No+Poster";

                // 🎯 Xác định quốc gia gốc
                let country = "Hoa Kỳ";
                if (m.origin_country && m.origin_country.length > 0) {
                    const countryCode = m.origin_country[0];
                    if (COUNTRY_MAP[countryCode]) {
                        country = COUNTRY_MAP[countryCode];
                    } else {
                        console.warn(`⚠️ Quốc gia không được hỗ trợ: ${countryCode} - Phim: "${m.title}"`);
                        country = "Quốc gia khác"; // Fallback an toàn
                    }
                }

                // 🌐 Xác định ngôn ngữ gốc
                let language = "Tiếng Anh";
                if (m.original_language) {
                    const langCode = m.original_language.toLowerCase();
                    if (LANGUAGE_MAP[langCode]) {
                        language = LANGUAGE_MAP[langCode];
                    } else {
                        console.warn(`⚠️ Ngôn ngữ không được hỗ trợ: ${langCode} - Phim: "${m.title}"`);
                        language = "Ngôn ngữ khác"; // Fallback an toàn
                    }
                }

                if (!exists) {
                    let realDuration = 90;
                    let trailerLink = "";
                    let directorName = "Đang cập nhật";
                    let actorsArray = [];
                    let genreIdsArray = [];

                    // 🎬 Lấy duration, trailer, director, actors
                    if (m.runtime && m.runtime > 0) realDuration = m.runtime;

                    if (m.videos?.results && m.videos.results.length > 0) {
                        const selectedVideo =
                            m.videos.results.find(v => v.site === "YouTube" && v.type === "Trailer" && v.iso_639_1 === "vi") ||
                            m.videos.results.find(v => v.site === "YouTube" && v.type === "Trailer" && v.iso_639_1 === "en") ||
                            m.videos.results.find(v => v.site === "YouTube" && v.type === "Trailer");
                        if (selectedVideo) trailerLink = `https://www.youtube.com/embed/${selectedVideo.key}`;
                    }

                    if (m.credits) {
                        const directorObj = m.credits.crew.find(c => c.job === "Director");
                        if (directorObj) directorName = directorObj.name;
                        const topCast = m.credits.cast.slice(0, 5).map(actor => actor.name);
                        if (topCast.length > 0) actorsArray = topCast;
                    }

                    // 🏷️ Lấy thể loại
                    if (m.genres && m.genres.length > 0) {
                        for (const g of m.genres) {
                            let existingGenre = await Genre.findOne({
                                name: { $regex: new RegExp("^" + g.name + "$", "i") },
                            });
                            if (!existingGenre) {
                                existingGenre = await Genre.create({
                                    name: g.name,
                                    description: `Thể loại ${g.name}`,
                                });
                            }
                            genreIdsArray.push(existingGenre._id);
                        }
                    }

                    // ✅ Tạo phim mới
                    try {
                        await Movie.create({
                            title: m.title || m.original_title,
                            tmdbId: m.id,
                            description: m.overview,
                            posterUrl: posterLink,
                            trailerUrl: trailerLink,
                            releaseDate: releaseDateObj,
                            status: currentStatus,
                            country: country,
                            duration: realDuration,
                            language: language,
                            rating: "C13",
                            director: directorName,
                            actors: actorsArray,
                            genres: genreIdsArray,
                        });
                        console.log(`✅ Thêm phim: "${m.title}" | ${country} | ${language}`);
                        newCount++;
                    } catch (err) {
                        console.error(
                            `❌ Lỗi tạo phim "${m.title}": ${err.message}`,
                            `| Country: ${country} | Language: ${language}`
                        );
                    }

                } else {
                    // ♻️ Cập nhật phim đã có
                    let needsUpdate = false;

                    if (!exists.director || exists.director === "Đang cập nhật" || !exists.actors || exists.actors.length === 0) {
                        if (m.credits) {
                            const directorObj = m.credits.crew.find(c => c.job === "Director");
                            if (directorObj) {
                                exists.director = directorObj.name;
                                needsUpdate = true;
                            }
                            const topCast = m.credits.cast.slice(0, 5).map(actor => actor.name);
                            if (topCast.length > 0) {
                                exists.actors = topCast;
                                needsUpdate = true;
                            }
                        }
                    }

                    if (!exists.genres || exists.genres.length === 0) {
                        if (m.genres && m.genres.length > 0) {
                            let genreIdsArray = [];
                            for (const g of m.genres) {
                                let existingGenre = await Genre.findOne({
                                    name: { $regex: new RegExp("^" + g.name + "$", "i") },
                                });
                                if (!existingGenre) {
                                    existingGenre = await Genre.create({
                                        name: g.name,
                                        description: `Thể loại ${g.name}`,
                                    });
                                }
                                genreIdsArray.push(existingGenre._id);
                            }
                            exists.genres = genreIdsArray;
                            needsUpdate = true;
                        }
                    }

                    // 🔄 Cập nhật country & language nếu thiếu
                    if (!exists.country || exists.country === "Chưa cập nhật") {
                        exists.country = country;
                        needsUpdate = true;
                    }
                    if (!exists.language || exists.language === "Chưa cập nhật") {
                        exists.language = language;
                        needsUpdate = true;
                    }

                    if (exists.isDeleted || needsUpdate) {
                        exists.isDeleted = false;
                        exists.posterUrl = posterLink;
                        exists.status = currentStatus;
                        exists.releaseDate = releaseDateObj;
                        await exists.save();
                        updateCount++;
                    }
                }

                processedCount++;
                if (processedCount % 20 === 0) {
                    console.log(`⏳ Đã xử lý ${processedCount}/${allMovies.size} phim...`);
                }
            } catch (err) {
                console.warn(`⚠️ Lỗi xử lý phim ${movieId}:`, err.message);
            }
        }

        console.log(
            `✅ [TMDB HOÀN THÀNH]: Thêm mới ${newCount} phim, Cập nhật ${updateCount} phim (Tổng: ${processedCount}/${allMovies.size})`
        );
        return true;
    } catch (error) {
        console.error("❌ Lỗi cào phim TMDB:", error);
        return false;
    }
};