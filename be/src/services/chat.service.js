import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";
import ChatHistory from "../models/chat-history.model.js";

class ChatService {
    constructor() {
        // Hỗ trợ nhiều cách viết trong .env: comma separated, newline separated, or JSON array
        const raw = process.env.GEMINI_API_KEYS || "";
        let keys = [];
        try {
            if (raw.trim().startsWith("[")) {
                keys = JSON.parse(raw);
            } else {
                // split by comma or whitespace/newline
                keys = raw.split(/[,\n\s]+/).map((k) => k.trim()).filter(Boolean);
            }
        } catch (e) {
            console.warn("⚠️ Không parse được GEMINI_API_KEYS từ .env, dùng tách theo dấu phẩy/space");
            keys = raw.split(/[,\n\s]+/).map((k) => k.trim()).filter(Boolean);
        }
        this.apiKeys = keys;
        this.currentKeyIndex = 0;
        console.log(`🔑 ChatService loaded ${this.apiKeys.length} GEMINI API key(s)`);
    }

    getActiveApiKey() {
        if (!this.apiKeys || this.apiKeys.length === 0) return null;
        // Ensure index is within bounds
        if (this.currentKeyIndex >= this.apiKeys.length) this.currentKeyIndex = 0;
        return this.apiKeys[this.currentKeyIndex] || null;
    }

    rotateKeyOnError() {
        if (!this.apiKeys || this.apiKeys.length === 0) return;
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        console.log(`🔄 Chuyển sang API key #${this.currentKeyIndex + 1}`);
    }

    hasValidKeys() {
        return Array.isArray(this.apiKeys) && this.apiKeys.length > 0;
    }

    // Simple in-memory cache for context data to reduce DB load
    _contextCache = { data: null, expiresAt: 0 };

    async _getCachedContext(ttlMs = 60 * 1000) {
        const now = Date.now();
        if (this._contextCache.data && this._contextCache.expiresAt > now) {
            return this._contextCache.data;
        }
        const data = await this._fetchContextNoCache();
        this._contextCache = { data, expiresAt: now + ttlMs };
        return data;
    }

    // internal fetch logic (kept for readability)
    async _fetchContextNoCache() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00 hôm nay
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const safeQuery = (promise, label) =>
            promise.catch((e) => {
                console.warn(`⚠️ Lỗi fetch ${label}:`, e.message);
                return [];
            });

        const [allActiveMovies, theaters, rawSchedules, products, vouchers] = await Promise.all([
            // Fetch tất cả phim chưa ngừng chiếu (cả "Đang chiếu" + "Sắp chiếu") để hỗ trợ movie_detail
            safeQuery(Movie.find({ status: { $ne: "Ngừng chiếu" } }).populate("genres", "name").lean(), "movies"),
            safeQuery(Theater.find({ isActive: true }).lean(), "theaters"),
            // FIX: startTime là string ("20:00"), lọc theo showDate (Date) mới đúng
            safeQuery(
                Schedule.find({
                    showDate: { $gte: today, $lte: next7Days },
                    status: { $in: ["Đang mở bán vé", "Sắp đầy"] },
                })
                    .populate("movie", "title")
                    .populate("theater", "name")
                    .sort({ showDate: 1, startTime: 1 })
                    .lean(),
                "schedules"
            ),
            safeQuery(Product.find({ isActive: true, isDeleted: { $ne: true } }).lean(), "products"),
            safeQuery(Voucher.find({ isActive: true, endDate: { $gte: now } }).lean(), "vouchers"),
        ]);

        // movies = chỉ "Đang chiếu" (dùng cho movie_list hiển thị)
        // allMovies = tất cả chưa ngừng (dùng cho movie_detail lookup)
        const movies = allActiveMovies.filter(m => m.status === "Đang chiếu");

        return { movies, allMovies: allActiveMovies, theaters, rawSchedules, products, vouchers, now, next7Days };
    }

    async fetchContextData() {
        // Use cached context to avoid heavy DB reads on each chat request
        try {
            return await this._getCachedContext(30 * 1000); // cache 30s
        } catch (err) {
            console.warn("⚠️ fetchContextData fallback error:", err.message);
            return await this._fetchContextNoCache();
        }
    }

    formatContextText(data) {
        const { movies, allMovies, theaters, rawSchedules, products, vouchers, now, next7Days } = data;

        // Dùng allMovies (bao gồm cả Sắp chiếu) để Gemini biết về TẤT CẢ phim
        const movieSource = allMovies?.length ? allMovies : (movies || []);

        // CHI TIẾT PHIM: bao gồm mô tả, thời lượng, rating, đạo diễn
        const moviesText = movieSource.length
            ? movieSource.map((m) => {
                const genres = m.genres?.length ? m.genres.map((g) => g.name).join(", ") : "Đang cập nhật";
                const statusLabel = m.status === "Sắp chiếu" ? " [Sắp chiếu]" : "";
                const parts = [`🎬 ${m.title}${statusLabel}`];
                parts.push(`  Thể loại: ${genres}`);
                if (m.duration) parts.push(`  Thời lượng: ${m.duration} phút`);
                if (m.rating) parts.push(`  Phân loại: ${m.rating}`);
                if (m.director) parts.push(`  Đạo diễn: ${m.director}`);
                if (m.language) parts.push(`  Ngôn ngữ: ${m.language}`);
                if (m.description) parts.push(`  Nội dung: ${m.description.substring(0, 200)}`);
                return parts.join("\n");
            }).join("\n\n")
            : "Chưa có phim nào";

        const theatersText = theaters?.length
            ? theaters.map((t) => `- ${t.name} (${t.city})`).join("\n")
            : "Chưa có rạp";

        const productsText = products?.length
            ? products.map((p) => {
                const parts = [`- ${p.name}`];
                if (p.category) parts.push(`(${p.category})`);
                if (p.size && p.size !== 'N/A') parts.push(`Size ${p.size}`);
                parts.push(`: ${Number(p.price).toLocaleString("vi-VN")} VNĐ`);
                return parts.join(" ");
            }).join("\n")
            : "Chưa có sản phẩm";

        const vouchersText = vouchers?.length
            ? vouchers.map((v) => {
                const discountStr = v.discountType === "fixed"
                    ? `${Number(v.discountValue).toLocaleString("vi-VN")} VNĐ`
                    : `${v.discountValue}%`;
                const endStr = v.endDate ? new Date(v.endDate).toLocaleDateString("vi-VN") : "";
                return `- 🎟️ ${v.code}: Giảm ${discountStr}${v.minOrderValue ? ` (đơn từ ${Number(v.minOrderValue).toLocaleString("vi-VN")}đ)` : ""}${endStr ? ` — HSD: ${endStr}` : ""}`;
            }).join("\n")
            : "Không có khuyến mãi";

        const schedulesText = rawSchedules?.length
            ? rawSchedules
                .filter((s) => s.movie && s.theater)
                .slice(0, 15)
                .map((s) => {
                    const dateStr = s.showDate ? new Date(s.showDate).toLocaleDateString("vi-VN") : "?";
                    return `- ${s.movie?.title || "?"} @ ${s.theater?.name || "?"} | Ngày ${dateStr} lúc ${s.startTime || "?"}`;
                })
                .join("\n")
            : "Chưa có lịch chiếu";

        return { moviesText, theatersText, productsText, vouchersText, schedulesText };
    }

    createSystemPrompt(userName, formattedText) {
        return `Bạn là CineBot 🎬 - trợ lý ảo thông minh của CineBooking.
Người dùng: ${userName}. Xưng "tớ", gọi khách "bạn".

📊 DỮ LIỆU THỰC TẾ (chỉ dùng thông tin này, KHÔNG bịa đặt):

🎬 PHIM ĐANG CHIẾU:
${formattedText.moviesText}

🏛️ RẠP PHIM:
${formattedText.theatersText}

🍿 BẮP & NƯỚC:
${formattedText.productsText}

🎟️ KHUYẾN MÃI:
${formattedText.vouchersText}

📅 LỊCH CHIẾU 7 NGÀY TỚI:
${formattedText.schedulesText}

QUY TẮC QUAN TRỌNG:
✅ TRẢ LỜI NGẮN GỌN, mỗi thông tin 1 dòng, dùng emoji đầu dòng
✅ Dùng \\n để xuống dòng, KHÔNG viết thành 1 đoạn dài
✅ Khi khách nhắc tên phim (dù sai chính tả nhẹ) → TÌM phim gần đúng nhất, trả action "movie_detail"
✅ Đọc LỊCH SỬ HỘI THOẠI để hiểu "phim đó", "bộ phim đó" đang nói về gì
✅ Nếu hỏi ngoài phạm vi rạp phim → xin lỗi ngắn gọn và chuyển hướng`;
    }

    extractMovieName(userMessage) {
        const match = userMessage.match(/phim\s+["']?([^"'?!,.\n]{2,50})["']?/i);
        if (match?.[1]) {
            const name = match[1].trim().toLowerCase();

            // Danh sách các từ khóa cấm nhận diện là tên phim
            const ignoreWords = [
                "đó", "này", "nào", "gì", "hay",
                "đang chiếu", "sắp chiếu", "mới", "rạp", "chiếu rạp",
                "kinh dị", "hành động", "tình cảm", "hoạt hình", "hài",
                "bom tấn", "hot", "nay", "hôm nay", "ngày mai"
            ];

            if (!ignoreWords.includes(name)) {
                return match[1].trim();
            }
        }
        return null;
    }

    extractTheaterName(userMessage) {
        const match = userMessage.match(/rạp\s+([a-zA-Z0-9\sÀ-ỹ]+?)(?:\.|,|\?|!|$)/i);
        if (match?.[1]) {
            const name = match[1].trim();
            if (!["đó", "nào", "gần", "nào đó"].includes(name.toLowerCase())) {
                return name;
            }
        }
        return null;
    }

    async saveChatMessage(sessionId, userId, userName, role, content, type, data) {
        try {
            let history = await ChatHistory.findOne({ sessionId });
            if (!history) {
                history = new ChatHistory({ sessionId, userId: userId || null, userName, messages: [] });
            }
            history.messages.push({
                role,
                content: String(content).slice(0, 2000), // giới hạn độ dài
                type: type || "text",
                data: data || null,
                timestamp: new Date(),
            });
            history.lastActivity = new Date();
            await history.save();
            return history;
        } catch (error) {
            console.error("❌ Lỗi lưu chat history:", error.message);
        }
    }

    async getChatHistory(sessionId, limit = 10) {
        try {
            const history = await ChatHistory.findOne({ sessionId });
            if (!history) return [];
            return history.messages.slice(-limit);
        } catch (error) {
            console.error("❌ Lỗi lấy chat history:", error.message);
            return [];
        }
    }
}

export default new ChatService();