import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";
import ChatHistory from "../models/chat-history.model.js";

class ChatService {
    constructor() {
        this.apiKeys = process.env.GEMINI_API_KEYS
            ? process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
            : [];
        this.currentKeyIndex = 0;
    }

    getActiveApiKey() {
        return this.apiKeys[this.currentKeyIndex] || null;
    }

    rotateKeyOnError() {
        if (this.apiKeys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            console.log(`🔄 Chuyển sang API key #${this.currentKeyIndex + 1}`);
        }
    }

    async fetchContextData() {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const safeQuery = (promise, label) =>
            promise.catch((e) => {
                console.warn(`⚠️ Lỗi fetch ${label}:`, e.message);
                return [];
            });

        const [movies, theaters, rawSchedules, products, vouchers] = await Promise.all([
            safeQuery(Movie.find({ status: "Đang chiếu" }).populate("genres", "name").lean(), "movies"),
            safeQuery(Theater.find({ isActive: true }).lean(), "theaters"),
            safeQuery(
                Schedule.find({ startTime: { $gte: now, $lte: next7Days } })
                    .populate("movie", "title")
                    .populate("theater", "name")
                    .sort({ startTime: 1 })
                    .lean(),
                "schedules"
            ),
            safeQuery(Product.find().lean(), "products"),
            safeQuery(Voucher.find({ isActive: true }).lean(), "vouchers"),
        ]);

        return { movies, theaters, rawSchedules, products, vouchers, now, next7Days };
    }

    formatContextText(data) {
        const { movies, theaters, rawSchedules, products, vouchers, now, next7Days } = data;

        const moviesText = movies?.length
            ? movies.slice(0, 8).map((m) => {
                const genres = m.genres?.length ? m.genres.map((g) => g.name).join(", ") : "Đang cập nhật";
                return `- ${m.title} | Thể loại: ${genres}${m.duration ? ` | ${m.duration} phút` : ""}`;
            }).join("\n")
            : "Chưa có phim nào";

        const theatersText = theaters?.length
            ? theaters.map((t) => `- ${t.name} (${t.city})`).join("\n")
            : "Chưa có rạp";

        const productsText = products?.length
            ? products.map((p) => `- ${p.name}: ${Number(p.price).toLocaleString("vi-VN")} VNĐ`).join("\n")
            : "Chưa có sản phẩm";

        const vouchersText = vouchers?.length
            ? vouchers.map((v) => `- ${v.code}: Giảm ${v.discount}%`).join("\n")
            : "Không có khuyến mãi";

        const schedulesText = rawSchedules?.length
            ? rawSchedules
                .filter((s) => {
                    try {
                        const d = new Date(s.startTime);
                        return s.movie && s.theater && d >= now && d <= next7Days;
                    } catch { return false; }
                })
                .slice(0, 8)
                .map((s) => {
                    const d = new Date(s.startTime);
                    return `- ${s.movie?.title || "?"} @ ${s.theater?.name || "?"} | ${d.toLocaleString("vi-VN")}`;
                })
                .join("\n")
            : "Chưa có lịch chiếu";

        return { moviesText, theatersText, productsText, vouchersText, schedulesText };
    }

    createSystemPrompt(userName, formattedText) {
        return `Bạn là CineBot 🎬 - trợ lý ảo thông minh của CineBooking.
        Người dùng hiện tại: ${userName}. Luôn xưng "tớ", gọi khách là "bạn".
        
        📊 DỮ LIỆU THỰC TẾ (chỉ dùng thông tin này):
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
        
        QUY TẮC CHỌN action:
        - "movie_list"   → khách hỏi phim gì, phim nào, gợi ý phim, danh sách phim
        - "schedule"     → khách hỏi lịch chiếu, giờ chiếu, chiếu lúc mấy giờ
        - "product_list" → khách hỏi bắp rang, nước uống, đồ ăn, combo
        - "chat"         → tất cả các câu hỏi khác
        
        QUY TẮC TRẢ LỜI:
        ✅ Tham chiếu lịch sử để hiểu ngữ cảnh ("phim đó" = phim đã nhắc trước đó)
        ✅ Chỉ dùng thông tin có trong dữ liệu trên, KHÔNG bịa đặt
        ✅ Trả lời ngắn gọn, thân thiện, có emoji phù hợp
        ✅ Nếu hỏi ngoài phạm vi rạp phim, xin lỗi và chuyển hướng`;
    }

    // ✅ FIX: trả về null thật, không phải chuỗi "null"
    extractMovieName(userMessage) {
        const match = userMessage.match(/phim\s+["']?([^"'?!,.\n]{2,50})["']?/i);
        if (match?.[1]) {
            const name = match[1].trim();
            if (!["đó", "này", "nào", "gì", "hay"].includes(name.toLowerCase())) {
                return name;
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