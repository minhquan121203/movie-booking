import { GoogleGenerativeAI } from "@google/generative-ai";
import chatService from "../services/chat.service.js";

// Danh sách model theo thứ tự ưu tiên
const MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];

/**
 * Gọi Gemini với cơ chế fallback toàn diện:
 * - Thử từng model, nếu 404 → model tiếp theo
 * - Nếu 429 → rotate key, thử lại tất cả model với key mới
 * - Tối đa thử qua tất cả key có sẵn
 */
async function callGeminiWithFullRetry(prompt) {
    const totalKeys = chatService.apiKeys?.length || 0;
    if (totalKeys === 0) {
        throw new Error("NO_API_KEY");
    }

    let lastError = null;

    for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) break;

        const genAI = new GoogleGenerativeAI(apiKey);
        console.log(`🔑 Đang dùng key #${chatService.currentKeyIndex + 1} (${apiKey.substring(0, 8)}...)`);

        for (const modelName of MODEL_CANDIDATES) {
            try {
                console.log(`🤖 Thử model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" },
                });
                const result = await model.generateContent(prompt);
                console.log(`✅ Thành công: key #${chatService.currentKeyIndex + 1} + model ${modelName}`);
                return result;
            } catch (err) {
                lastError = err;
                const msg = err.message || "";

                if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
                    console.warn(`⚠️ Model ${modelName} không khả dụng, thử model tiếp...`);
                    continue;
                }

                if (msg.includes("429") || err.status === 429) {
                    console.warn(`⚠️ Key #${chatService.currentKeyIndex + 1} bị rate limit, xoay key...`);
                    chatService.rotateKeyOnError();
                    break;
                }

                if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("quota")) {
                    console.warn(`⚠️ Key #${chatService.currentKeyIndex + 1} bị từ chối/hết quota, xoay key...`);
                    chatService.rotateKeyOnError();
                    break;
                }

                console.warn(`⚠️ Lỗi không xác định với ${modelName}: ${msg.substring(0, 100)}`);
                continue;
            }
        }
    }

    throw lastError || new Error("ALL_KEYS_EXHAUSTED");
}

// Sanitize Gemini/text response to extract JSON block when model returns markdown or commentary
function sanitizeJSONResponse(text) {
    if (!text || typeof text !== 'string') return text;
    // Remove markdown code fences
    let t = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
    // If the assistant prefixes with text before JSON, try to extract the first {...} block
    const firstBrace = t.indexOf('{');
    const lastBrace = t.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = t.substring(firstBrace, lastBrace + 1);
        return candidate;
    }
    return t;
}

/**
 * Tìm phim trong DB bằng tên (fuzzy match)
 */
function findMovieByName(movieName, movies) {
    if (!movieName || !movies?.length) return null;

    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const target = normalize(movieName);

    // Exact match first
    let found = movies.find(m => normalize(m.title) === target);
    if (found) return found;

    // Partial match
    found = movies.find(m => normalize(m.title).includes(target) || target.includes(normalize(m.title)));
    if (found) return found;

    // Word-based fuzzy match
    const targetWords = target.split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;
    for (const m of movies) {
        const titleWords = normalize(m.title).split(/\s+/);
        const matchCount = targetWords.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw))).length;
        const score = matchCount / Math.max(targetWords.length, titleWords.length);
        if (score > bestScore && score >= 0.4) {
            bestScore = score;
            bestMatch = m;
        }
    }
    return bestMatch;
}

/**
 * Tạo data chi tiết cho 1 phim (dùng cho movie_detail action)
 */
function buildMovieDetailData(movie) {
    return {
        _id: movie._id,
        title: movie.title,
        poster: movie.posterUrl,
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl || "",
        description: movie.description || "",
        duration: movie.duration,
        rating: movie.rating,
        genre: movie.genres?.map(g => g.name).join(", ") || "Đang cập nhật",
        language: movie.language,
        country: movie.country,
        director: movie.director,
        actors: movie.actors,
        releaseDate: movie.releaseDate,
        averageRating: movie.averageRating,
        totalReviews: movie.totalReviews,
    };
}

/**
 * Fallback thông minh: khi Gemini hoàn toàn không khả dụng
 */
function buildSmartFallback(userMessage, contextData) {
    const msg = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const msgOriginal = userMessage.toLowerCase();

    // Kiểm tra hỏi về phim
    const movieKeywords = ["phim", "xem gi", "xem gì", "dang chieu", "đang chiếu", "goi y", "gợi ý", "co phim", "có phim", "chieu gi", "chiếu gì"];
    if (movieKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
        // Thử tìm phim cụ thể trước
        const extractedName = chatService.extractMovieName(userMessage);
        if (extractedName) {
            const movie = findMovieByName(extractedName, contextData.allMovies || contextData.movies);
            if (movie) {
                const genres = movie.genres?.map(g => g.name).join(", ") || "Đang cập nhật";
                const detail = `🎬 **${movie.title}**\n📝 ${movie.description || "Chưa có mô tả"}\n🎭 Thể loại: ${genres}\n⏱️ Thời lượng: ${movie.duration || "?"} phút\n🔞 Phân loại: ${movie.rating || "P"}\n🌐 Ngôn ngữ: ${movie.language || "Đang cập nhật"}${movie.director ? `\n🎬 Đạo diễn: ${movie.director}` : ""}`;
                return {
                    text: detail,
                    type: "movie_detail",
                    data: buildMovieDetailData(movie),
                };
            }
        }

        // Fallback: danh sách phim
        const movies = (contextData.movies || []).slice(0, 10);
        if (movies.length > 0) {
            const movieNames = movies.map(m => m.title).join(", ");
            return {
                text: `🎬 Hiện tại CineBooking đang chiếu các phim: ${movieNames}. Bạn muốn xem phim nào nhé?`,
                type: "movie_list",
                data: movies.map(m => ({
                    _id: m._id,
                    title: m.title,
                    poster: m.posterUrl,
                    posterUrl: m.posterUrl,
                    genre: m.genres?.map(g => g.name).join(", ") || "Phim rạp",
                })),
            };
        }
        return { text: "Hiện tại chưa có phim nào đang chiếu. Bạn quay lại sau nhé! 🎬", type: "text", data: [] };
    }

    // Kiểm tra hỏi về đồ ăn / bắp nước
    const productKeywords = ["bap", "bắp", "nuoc", "nước", "do an", "đồ ăn", "combo", "popcorn", "snack", "an gi", "ăn gì", "menu"];
    if (productKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
        const products = (contextData.products || []);
        if (products.length > 0) {
            const productList = products.map(p => `- ${p.name} (${p.size || ''} - ${p.category || ''}): ${Number(p.price).toLocaleString("vi-VN")} VNĐ`).join("\n");
            return {
                text: `🍿 Menu bắp nước tại CineBooking:\n${productList}\nBạn muốn đặt gì nhé?`,
                type: "product_list",
                data: products.map(p => ({
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    imageUrl: p.imageUrl,
                    image: p.imageUrl,
                    category: p.category,
                    size: p.size,
                })),
            };
        }
        return { text: "Hiện tại chưa có thông tin menu bắp nước. Bạn thử hỏi lại sau nhé! 🍿", type: "text", data: [] };
    }

    // Kiểm tra hỏi về lịch chiếu
    const scheduleKeywords = ["lich chieu", "lịch chiếu", "gio chieu", "giờ chiếu", "suat chieu", "suất chiếu", "may gio", "mấy giờ", "chieu luc", "chiếu lúc"];
    if (scheduleKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
        const schedules = (contextData.rawSchedules || []).slice(0, 8);
        if (schedules.length > 0) {
            const scheduleList = schedules
                .filter(s => s.movie && s.theater)
                .map(s => {
                    const dateStr = s.showDate ? new Date(s.showDate).toLocaleDateString("vi-VN") : "?";
                    return `- ${s.movie?.title || "?"} @ ${s.theater?.name || "?"} | Ngày ${dateStr} lúc ${s.startTime || "?"}`;
                })
                .join("\n");
            return {
                text: `📅 Lịch chiếu sắp tới:\n${scheduleList}\nBạn muốn đặt vé phim nào nhé?`,
                type: "text",
                data: [],
            };
        }
        return { text: "Hiện chưa có lịch chiếu nào trong 7 ngày tới. Bạn quay lại sau nhé! 📅", type: "text", data: [] };
    }

    // Kiểm tra hỏi về rạp
    const theaterKeywords = ["rap", "rạp", "dia chi", "địa chỉ", "o dau", "ở đâu", "chi nhanh", "chi nhánh"];
    if (theaterKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
        const theaters = (contextData.theaters || []);
        if (theaters.length > 0) {
            const theaterList = theaters.map(t => `- 🏛️ ${t.name} (${t.city})`).join("\n");
            return {
                text: `Hệ thống rạp CineBooking:\n${theaterList}\nBạn muốn xem phim ở rạp nào nhé?`,
                type: "text",
                data: [],
            };
        }
        return { text: "Hiện chưa có thông tin rạp phim. Bạn thử hỏi lại sau nhé! 🏛️", type: "text", data: [] };
    }

    // Kiểm tra hỏi về khuyến mãi
    const voucherKeywords = ["khuyen mai", "khuyến mãi", "giam gia", "giảm giá", "voucher", "uu dai", "ưu đãi", "ma giam", "mã giảm"];
    if (voucherKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
        const vouchers = (contextData.vouchers || []);
        if (vouchers.length > 0) {
            const voucherList = vouchers.map(v => `- 🎟️ ${v.code}: Giảm ${v.discount}%`).join("\n");
            return {
                text: `Chương trình khuyến mãi hiện có:\n${voucherList}\nNhập mã khi thanh toán nhé!`,
                type: "text",
                data: [],
            };
        }
        return { text: "Hiện chưa có chương trình khuyến mãi nào. Bạn theo dõi thường xuyên nhé! 🎟️", type: "text", data: [] };
    }

    // Chào hỏi
    const greetKeywords = ["xin chao", "xin chào", "hello", "hi", "chao", "chào", "hey"];
    if (greetKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
        return {
            text: "Xin chào bạn! 👋 Tớ là CineBot - trợ lý ảo của CineBooking. Tớ có thể giúp bạn:\n🎬 Xem phim đang chiếu\n📅 Tra lịch chiếu\n🍿 Xem menu bắp nước\n🎟️ Tìm khuyến mãi\nBạn cần tớ giúp gì nhé?",
            type: "text",
            data: [],
        };
    }

    // Mặc định
    return {
        text: "Xin lỗi bạn, tớ đang gặp chút trục trặc kỹ thuật 🙏 Nhưng tớ vẫn có thể giúp bạn:\n🎬 Hỏi \"phim đang chiếu\" để xem danh sách phim\n📅 Hỏi \"lịch chiếu\" để xem giờ chiếu\n🍿 Hỏi \"bắp nước\" để xem menu\n🎟️ Hỏi \"khuyến mãi\" để xem ưu đãi\nBạn thử hỏi lại nhé!",
        type: "text",
        data: [],
    };
}

export const handleChat = async (req, res) => {
    const {
        userMessage,
        sessionId = `session_${Date.now()}_${Math.random()}`,
        userId = null,
        userName = "Khách VIP",
    } = req.body;

    try {
        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({
                botMessage: { text: "Bạn cần nói gì đó để tớ trả lời nhé!", type: "text", data: [] },
            });
        }

        // 1. Fetch Data từ DB
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
            console.log(`📊 DB: ${contextData.movies?.length || 0} phim, ${contextData.theaters?.length || 0} rạp, ${contextData.products?.length || 0} sản phẩm, ${contextData.rawSchedules?.length || 0} lịch chiếu`);
        } catch (e) {
            console.error("❌ Lỗi fetch DB:", e.message);
            contextData = { movies: [], allMovies: [], theaters: [], rawSchedules: [], products: [], vouchers: [] };
        }

        // QUICK SERVER-SIDE INTENT: Cập nhật từ khóa Top/Hot để lấy rating
        try {
            // Thêm các từ khóa "top", "hot", "thịnh hành"
            const movieListKeywords = ["phim nào", "phim hay", "gợi ý phim", "phim mới", "có phim", "recommend", "gợi ý", "phim gì", "phim đang chiếu", "top", "hot", "thịnh hành"];
            const lowMsg = userMessage.toLowerCase();

            // Kiểm tra xem khách có đang hỏi chi tiết hoặc tìm tên phim cụ thể không
            const extractedName = chatService.extractMovieName(userMessage);
            const detailKeywords = ["thông tin", "chi tiết", "nội dung", "review", "review phim"];
            const isAskingDetail = detailKeywords.some(kw => lowMsg.includes(kw));

            // Chỉ block và trả list nhanh khi KHÔNG hỏi chi tiết và KHÔNG nói tên phim cụ thể
            if (!extractedName && !isAskingDetail && movieListKeywords.some(kw => lowMsg.includes(kw))) {

                // Chỉ lấy phim đang chiếu
                let moviesSource = (contextData.movies || []).filter(m => !m.isDeleted && m.status === "Đang chiếu");

                // LOGIC TOP MOVIE: Sắp xếp theo rating giảm dần
                if (lowMsg.includes("top") || lowMsg.includes("hot") || lowMsg.includes("hay") || lowMsg.includes("thịnh hành")) {
                    moviesSource.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                }

                // Cắt lấy tối đa 8 phim xuất sắc nhất đưa lên UI
                const pick = moviesSource.slice(0, 8);

                const movieItems = pick.map(m => ({
                    _id: m._id,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    trailerUrl: m.trailerUrl,
                    genre: m.genres?.map(g => g.name).join(", ") || "Phim rạp",
                    rating: m.rating,
                }));

                const botMsg = {
                    text: `🎬 Dưới đây là các phim ${lowMsg.includes("top") || lowMsg.includes("hot") ? 'TOP thịnh hành' : 'đang chiếu'} bạn có thể quan tâm:`,
                    type: "movie_list",
                    data: movieItems,
                };

                // Save history
                try {
                    await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                    await chatService.saveChatMessage(sessionId, userId, userName, "bot", botMsg.text, botMsg.type, botMsg.data);
                } catch (e) {
                    console.warn("⚠️ Lỗi lưu lịch sử khi trả movie_list quick:", e.message);
                }

                return res.json({ botMessage: botMsg, sessionId });
            }
        } catch (e) {
            console.warn("⚠️ Lỗi xử lý quick intent phim:", e.message);
        }

        // QUICK SERVER-SIDE INTENT: Lịch chiếu (trả type "schedule" để FE render card UI)
        try {
            const lowMsg = userMessage.toLowerCase();
            const scheduleKeywords = ["lịch chiếu", "lich chieu", "giờ chiếu", "gio chieu", "suất chiếu", "suat chieu", "mấy giờ", "may gio", "chiếu lúc", "chieu luc"];
            const isScheduleQuery = scheduleKeywords.some(kw => lowMsg.includes(kw));

            if (isScheduleQuery) {
                let schedules = (contextData.rawSchedules || []).filter(s => s.movie && s.theater);

                // Lọc theo "hôm nay" nếu user hỏi cụ thể
                const todayKeywords = ["hôm nay", "hom nay", "today", "hnay"];
                const isAskingToday = todayKeywords.some(kw => lowMsg.includes(kw));

                if (isAskingToday) {
                    const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
                    schedules = schedules.filter(s => {
                        const showDateStr = new Date(s.showDate).toLocaleDateString("en-CA");
                        return showDateStr === todayStr;
                    });
                }

                if (schedules.length > 0) {
                    const scheduleItems = schedules.slice(0, 10).map(s => ({
                        movieId: s.movie?._id || null,
                        movieTitle: s.movie?.title || "?",
                        theaterName: s.theater?.name || "?",
                        roomName: s.roomName || "?",
                        showDate: s.showDate ? new Date(s.showDate).toLocaleDateString("vi-VN") : "?",
                        startTime: s.startTime || "?",
                        endTime: s.endTime || "?",
                    }));

                    const label = isAskingToday ? "hôm nay" : "sắp tới";
                    const botMsg = {
                        text: `📅 Lịch chiếu ${label} (${scheduleItems.length} suất):`,
                        type: "schedule",
                        data: scheduleItems,
                    };

                    try {
                        await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                        await chatService.saveChatMessage(sessionId, userId, userName, "bot", botMsg.text, botMsg.type, botMsg.data);
                    } catch (e) {
                        console.warn("⚠️ Lỗi lưu lịch sử quick schedule:", e.message);
                    }

                    return res.json({ botMessage: botMsg, sessionId });
                } else {
                    // Không có suất chiếu → trả lời rõ ràng
                    const noScheduleText = isAskingToday
                        ? "📅 Hôm nay hiện tại chưa có suất chiếu nào. Bạn thử hỏi \"lịch chiếu\" để xem các ngày tới nhé! 🎬"
                        : "📅 Hiện chưa có lịch chiếu nào trong 7 ngày tới. Bạn quay lại sau nhé! 🎬";

                    const botMsg = { text: noScheduleText, type: "text", data: [] };

                    try {
                        await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                        await chatService.saveChatMessage(sessionId, userId, userName, "bot", botMsg.text, botMsg.type, botMsg.data);
                    } catch (e) {
                        console.warn("⚠️ Lỗi lưu lịch sử:", e.message);
                    }

                    return res.json({ botMessage: botMsg, sessionId });
                }
            }
        } catch (e) {
            console.warn("⚠️ Lỗi xử lý quick intent lịch chiếu:", e.message);
        }

        // QUICK SERVER-SIDE INTENT: Bắp nước / Đồ ăn
        try {
            const lowMsg = userMessage.toLowerCase();
            const productKeywords = ["bắp nước", "bap nuoc", "đồ ăn", "do an", "menu", "combo", "popcorn", "snack", "nước uống", "nuoc uong", "bắp rang", "bap rang"];
            const isProductQuery = productKeywords.some(kw => lowMsg.includes(kw));

            if (isProductQuery) {
                const products = (contextData.products || []);
                if (products.length > 0) {
                    const productItems = products.map(p => ({
                        _id: p._id,
                        name: p.name,
                        price: p.price,
                        imageUrl: p.imageUrl,
                        image: p.imageUrl,
                        category: p.category,
                        size: p.size,
                    }));

                    const botMsg = {
                        text: `🍿 Menu bắp nước tại CineBooking (${productItems.length} sản phẩm):`,
                        type: "product_list",
                        data: productItems,
                    };

                    try {
                        await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                        await chatService.saveChatMessage(sessionId, userId, userName, "bot", botMsg.text, botMsg.type, botMsg.data);
                    } catch (e) {
                        console.warn("⚠️ Lỗi lưu lịch sử quick product:", e.message);
                    }

                    return res.json({ botMessage: botMsg, sessionId });
                }
            }
        } catch (e) {
            console.warn("⚠️ Lỗi xử lý quick intent bắp nước:", e.message);
        }

        // 2. Kiểm tra API Key
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey || !chatService.hasValidKeys()) {
            console.warn("⚠️ Không có API key, dùng fallback từ DB");
            const fallback = buildSmartFallback(userMessage, contextData);
            return res.json({ botMessage: fallback, sessionId });
        }

        // 3. ĐỌC LỊCH SỬ HỘI THOẠI (để chatbot nhớ ngữ cảnh)
        let chatHistory = [];
        try {
            chatHistory = await chatService.getChatHistory(sessionId, 8);
        } catch (e) {
            console.warn("⚠️ Không đọc được lịch sử chat:", e.message);
        }

        // Format lịch sử thành text cho prompt
        let historyText = "";
        if (chatHistory.length > 0) {
            historyText = "\n\n💬 LỊCH SỬ HỘI THOẠI GẦN ĐÂY (dùng để hiểu ngữ cảnh, \"phim đó\", \"cái đó\" là gì):\n";
            historyText += chatHistory.map(msg => {
                const role = msg.role === "user" ? "Khách" : "CineBot";
                return `${role}: ${msg.content}`;
            }).join("\n");
        }

        // 4. Tạo System Prompt chi tiết (bao gồm thông tin chi tiết phim)
        const formattedText = chatService.formatContextText(contextData);
        const systemPrompt = chatService.createSystemPrompt(userName, formattedText);

        const jsonFormat = `
        LUÔN trả về JSON thuần túy theo format sau (KHÔNG markdown, KHÔNG code block):
        {
        "response": "Câu trả lời ngắn gọn, dễ đọc, có xuống dòng",
        "action": "chat" | "movie_list" | "movie_detail" | "schedule" | "product_list",
        "phim": "Tên phim GẦN ĐÚNG NHẤT trong dữ liệu (nếu khách hỏi về phim) hoặc null",
        "rap": "Tên rạp nếu có hoặc null"
        }

        QUY TẮC FORMAT "response" (RẤT QUAN TRỌNG):
        - NGẮN GỌN, tối đa 3-5 dòng
        - Dùng \n để xuống dòng, KHÔNG viết 1 đoạn dài
        - Dùng emoji đầu mỗi dòng để dễ đọc
        - Ví dụ format đẹp:
        "🎬 Tội Phạm 101\n📝 Nội dung: ...\n🎭 Thể loại: Hình Sự, Gây Cấn\n⏱️ Thời lượng: 141 phút\n🔞 Phân loại: C16"

        QUY TẮC CHỌN action:
        - "movie_list"   → khách hỏi DANH SÁCH phim, gợi ý, có phim gì
        - "movie_detail" → khách hỏi về 1 PHIM CỤ THỂ (giới thiệu phim X, phim X là gì, nội dung phim X)
        - "schedule"     → khách hỏi lịch chiếu, giờ chiếu
        - "product_list" → khách hỏi bắp rang, nước uống, đồ ăn, combo
        - "chat"         → chào hỏi, cảm ơn, câu hỏi chung

        QUAN TRỌNG VỀ PHIM:
        - Khi khách nhắc tên phim (dù sai chính tả nhẹ), TÌM phim GẦN ĐÚNG NHẤT trong dữ liệu
        - LUÔN trả action: "movie_detail" + "phim": "TÊN CHÍNH XÁC TRONG DỮ LIỆU" khi tìm thấy
        - Nếu khách nói "phim đó" → tìm trong LỊCH SỬ HỘI THOẠI`;

        const prompt = `${systemPrompt}${historyText}\n\n${jsonFormat}\n\nKhách nói: "${userMessage}"`;

        // 5. GỌI GEMINI - nhưng để giảm độ trễ trả lời, race giữa Gemini và timeout ngắn.
        // Nếu Gemini chưa trả lời sau TIMEOUT_MS, trả nhanh bằng fallback thông minh từ DB,
        // đồng thời tiếp tục chờ Gemini nền và lưu kết quả đầy đủ vào DB để đảm bảo tính chính xác.
        const TIMEOUT_MS = 1800; // 1.8s quick response threshold

        const geminiPromise = callGeminiWithFullRetry(prompt).catch(err => ({ __geminiError: err }));
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), TIMEOUT_MS));

        const raceResult = await Promise.race([
            geminiPromise.then(r => ({ result: r })),
            timeoutPromise,
        ]);

        // If timed out -> return quick fallback while continuing to wait Gemini in background
        if (raceResult && raceResult.timedOut) {
            console.log(`⏱️ Gemini chưa kịp trả lời sau ${TIMEOUT_MS}ms, trả nhanh bằng fallback từ DB.`);
            const fallback = buildSmartFallback(userMessage, contextData);

            // Save user + fallback bot quickly
            try {
                await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                await chatService.saveChatMessage(sessionId, userId, userName, "bot", fallback.text, fallback.type, fallback.data);
            } catch (err) {
                console.warn("⚠️ Lỗi lưu chat history (quick fallback):", err.message);
            }

            // Keep listening to the full Gemini result and persist when available (no client push)
            geminiPromise.then(async (fullResult) => {
                try {
                    if (fullResult && fullResult.__geminiError) {
                        console.warn("⚠️ Gemini background error:", fullResult.__geminiError.message || fullResult.__geminiError);
                        return;
                    }

                    const responseText = fullResult.response.text();
                    let aiData;
                    try {
                        const sanitized = sanitizeJSONResponse(responseText);
                        aiData = JSON.parse(sanitized);
                    } catch (e) {
                        aiData = { response: responseText || "Tớ chưa hiểu ý bạn, bạn nói lại nhé!", action: "chat" };
                    }

                    // Build botResponse similar to main flow (simplified):
                    let botResponse = { text: aiData.response, type: "text", data: [] };
                    if (aiData.action === "movie_detail" && aiData.phim) {
                        const movie = findMovieByName(aiData.phim, contextData.allMovies || contextData.movies);
                        if (movie) {
                            botResponse.type = "movie_detail";
                            botResponse.data = buildMovieDetailData(movie);
                        }
                    }

                    // Persist the Gemini bot message as a follow-up (so DB remains "correct")
                    await chatService.saveChatMessage(sessionId, userId, userName, "bot", botResponse.text, botResponse.type, botResponse.data);
                } catch (err) {
                    console.warn("⚠️ Lỗi lưu Gemini background response:", err.message || err);
                }
            }).catch((e) => console.warn("⚠️ Gemini background unexpected error:", e.message || e));

            return res.json({ botMessage: fallback, sessionId });
        }

        // 7. XỬ LÝ RESPONSE TỪ GEMINI
        const result = raceResult && raceResult.result ? raceResult.result : null;

        if (!result || result.__geminiError) {
            console.error("❌ Tất cả Gemini key/model đều thất bại:", (result && result.__geminiError && result.__geminiError.message) || "unknown");
            // fallback
            const fallback = buildSmartFallback(userMessage, contextData);
            try {
                await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                await chatService.saveChatMessage(sessionId, userId, userName, "bot", fallback.text, fallback.type, fallback.data);
            } catch (err) {
                console.warn("⚠️ Lỗi lưu chat history (gemini failed):", err.message);
            }
            return res.json({ botMessage: fallback, sessionId });
        }

        const responseText = result.response.text();
        console.log("📝 Gemini raw response:", responseText.substring(0, 300));

        let aiData;
        try {
            const sanitized = sanitizeJSONResponse(responseText);
            aiData = JSON.parse(sanitized);
        } catch (e) {
            console.warn("⚠️ Gemini trả về không phải JSON:", responseText.substring(0, 200));
            aiData = { response: responseText || "Tớ chưa hiểu ý bạn, bạn nói lại nhé!", action: "chat" };
        }

        let botResponse = { text: aiData.response, type: "text", data: [] };

        // === ACTION: movie_detail — hỏi về 1 phim cụ thể ===
        if (aiData.action === "movie_detail" && aiData.phim) {
            const movie = findMovieByName(aiData.phim, contextData.allMovies || contextData.movies);
            if (movie) {
                botResponse.type = "movie_detail";
                botResponse.data = buildMovieDetailData(movie);
            } else {
                botResponse.type = "text";
            }
        }

        // === POST-PROCESSING: Gemini trả chat nhưng user hỏi về phim → tự tìm ===
        if (aiData.action === "chat" && botResponse.type === "text") {
            // Trích tên phim từ userMessage
            const extractedName = chatService.extractMovieName(userMessage);
            if (extractedName) {
                const movie = findMovieByName(extractedName, contextData.allMovies || contextData.movies);
                if (movie) {
                    console.log(`🔍 Post-processing: tìm thấy phim "${movie.title}" từ "${extractedName}"`);
                    const genres = movie.genres?.map(g => g.name).join(", ") || "Đang cập nhật";
                    botResponse.type = "movie_detail";
                    botResponse.data = buildMovieDetailData(movie);
                    // Nếu Gemini trả text "không tìm thấy" → override text
                    if (botResponse.text.includes("không tìm thấy") || botResponse.text.includes("không có")) {
                        botResponse.text = `🎬 ${movie.title}\n📝 ${movie.description || "Phim đang chiếu tại CineBooking"}\n🎭 Thể loại: ${genres}\n⏱️ Thời lượng: ${movie.duration || "?"} phút\n🔞 Phân loại: ${movie.rating || "P"}${movie.director ? `\n🎬 Đạo diễn: ${movie.director}` : ""}\n\nBạn muốn đặt vé xem phim này không? 🎟️`;
                    }
                }
            }
            // Cũng thử nếu Gemini trả tên phim trong response
            if (botResponse.type === "text" && aiData.phim) {
                const movie = findMovieByName(aiData.phim, contextData.allMovies || contextData.movies);
                if (movie) {
                    botResponse.type = "movie_detail";
                    botResponse.data = buildMovieDetailData(movie);
                }
            }
        }

        // === ACTION: movie_list — danh sách phim ===
        if (aiData.action === "movie_list") {
            botResponse.type = "movie_list";
            botResponse.data = (contextData.movies || [])
                .map((m) => ({
                    _id: m._id,
                    title: m.title,
                    poster: m.posterUrl,
                    posterUrl: m.posterUrl,
                    genre: m.genres?.map((g) => g.name).join(", ") || "Phim rạp",
                }))
                .slice(0, 10);
        }

        // === ACTION: product_list — menu bắp nước ===
        if (aiData.action === "product_list") {
            botResponse.type = "product_list";
            botResponse.data = (contextData.products || [])
                .map((p) => ({
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    imageUrl: p.imageUrl,
                    image: p.imageUrl,
                    category: p.category,
                    size: p.size,
                }));
        }

        // === ACTION: schedule — lịch chiếu ===
        if (aiData.action === "schedule") {
            botResponse.type = "schedule";
            // Nếu Gemini trả tên phim cụ thể → lọc lịch chiếu theo phim đó
            let schedules = (contextData.rawSchedules || []).filter(s => s.movie && s.theater);

            if (aiData.phim) {
                const movieMatch = findMovieByName(aiData.phim, contextData.movies);
                if (movieMatch) {
                    const movieSchedules = schedules.filter(s =>
                        s.movie?.title === movieMatch.title || String(s.movie?._id) === String(movieMatch._id)
                    );
                    if (movieSchedules.length > 0) {
                        schedules = movieSchedules;
                    }
                }
            }

            botResponse.data = schedules.slice(0, 10).map(s => ({
                movieId: s.movie?._id || null,
                movieTitle: s.movie?.title || "?",
                theaterName: s.theater?.name || "?",
                roomName: s.roomName || "?",
                showDate: s.showDate ? new Date(s.showDate).toLocaleDateString("vi-VN") : "?",
                startTime: s.startTime || "?",
                endTime: s.endTime || "?",
            }));
        }

        // 8. Lưu lịch sử chat (quan trọng cho memory!)
        try {
            await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
            await chatService.saveChatMessage(sessionId, userId, userName, "bot", botResponse.text, botResponse.type, botResponse.data);
        } catch (err) {
            console.warn("⚠️ Lỗi lưu chat history:", err.message);
        }

        return res.json({ botMessage: botResponse, sessionId });

    } catch (error) {
        console.error("❌ LỖI CHATBOT CRITICAL:", error.message, error.stack);
        return res.status(500).json({
            botMessage: {
                text: "Xin lỗi bạn, hệ thống chatbot đang gặp sự cố. Vui lòng thử lại sau ít phút nhé! 🙏",
                type: "text",
                data: [],
            },
        });
    }
};