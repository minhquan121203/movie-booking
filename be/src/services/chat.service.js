import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";
import ChatHistory from "../models/chat-history.model.js";

class ChatService {
    constructor() {
        this.apiKeys = process.env.GEMINI_API_KEYS
            ? process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim())
            : [];
        this.currentKeyIndex = 0;
        this.nextKeyRotationTime = Date.now() + 3600000; // Rotate mỗi 1h
    }

    // 🔄 Auto rotate API key mỗi 1h
    getActiveApiKey() {
        if (Date.now() > this.nextKeyRotationTime && this.apiKeys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            this.nextKeyRotationTime = Date.now() + 3600000;
            console.log(`✅ Rotated to API key #${this.currentKeyIndex + 1}`);
        }
        return this.apiKeys[this.currentKeyIndex];
    }

    rotateKeyOnError() {
        if (this.apiKeys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            console.log(`❌ Switched to backup API key #${this.currentKeyIndex + 1}`);
        }
    }

    // 📊 Lấy dữ liệu từ DB với cache-like approach
    async fetchContextData() {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [movies, theaters, rawSchedules, products, vouchers] =
            await Promise.all([
                Movie.find({ status: "Đang chiếu" }).populate("genres", "name").lean(),
                Theater.find({ isActive: true }).lean(),
                Schedule.find()
                    .populate("movie", "title")
                    .populate("theater", "name")
                    .sort({ startTime: 1 })
                    .lean(),
                Product.find().lean(),
                Voucher.find({ isActive: true }).lean(),
            ]);

        return { movies, theaters, rawSchedules, products, vouchers, now, next7Days };
    }

    // 🎬 Format dữ liệu thành text để AI đọc
    formatContextText(data) {
        const {
            movies,
            theaters,
            rawSchedules,
            products,
            vouchers,
            now,
            next7Days,
        } = data;

        const moviesText =
            movies.length > 0
                ? movies
                    .map((m) => {
                        const genres =
                            m.genres && m.genres.length > 0
                                ? m.genres.map((g) => g.name).join(", ")
                                : "Đang cập nhật";
                        return `- Phim: "${m.title}" | Thể loại: ${genres} | Thời lượng: ${m.duration} phút | Đánh giá: ${m.rating}`;
                    })
                    .join("\n")
                : "Không có phim nào";

        const theatersText =
            theaters.length > 0
                ? theaters
                    .map((t) => `- Rạp: ${t.name} (${t.address}, ${t.city})`)
                    .join("\n")
                : "Không có rạp nào";

        const productsText =
            products.length > 0
                ? products.map((p) => `- ${p.name} | ${p.price} VNĐ`).join("\n")
                : "Hết bắp nước";

        const vouchersText =
            vouchers.length > 0
                ? vouchers.map((v) => `- Mã: ${v.code} | Giảm: ${v.discount}%`).join("\n")
                : "Không có khuyến mãi";

        const schedulesText =
            rawSchedules.length > 0
                ? rawSchedules
                    .filter((s) => {
                        const d = new Date(s.startTime);
                        return s.movie && s.theater && d >= now && d <= next7Days;
                    })
                    .slice(0, 10)
                    .map((s) => {
                        const d = new Date(s.startTime);
                        return `- ${s.movie.title} @ ${s.theater.name} | ${d.toLocaleTimeString("vi-VN")} ${d.toLocaleDateString("vi-VN")} | ${s.availableSeats} ghế`;
                    })
                    .join("\n")
                : "Chưa có lịch chiếu";

        return {
            moviesText,
            theatersText,
            productsText,
            vouchersText,
            schedulesText,
        };
    }

    // 📝 Tạo System Prompt tối ưu
    createSystemPrompt(userName, formattedText) {
        return `Bạn là CineBot, trợ lý ảo của CineBooking.
Người dùng: ${userName}. Xưng "tớ", gọi khách là "bạn".

🎬 DỮ LIỆU HIỆN TẠI:
PHIM: ${formattedText.moviesText}
RẠP: ${formattedText.theatersText}
BẮP NƯỚC: ${formattedText.productsText}
KHUYẾN MÃI: ${formattedText.vouchersText}
LỊCH CHIẾU: ${formattedText.schedulesText}

QUY TẮC:
1. KHÔNG bịa dặt thông tin
2. Nếu khách thank BUỒN/THẤT TÌNH: gợi ý phim Hài/Tình cảm
3. Nếu khách than CHÁN: gợi ý phim Hành động/Kinh dị
4. Luôn trả về JSON với cấu trúc chính xác`;
    }

    // 🧠 Build history cho Gemini API
    buildChatHistory(messageHistory) {
        const validHistory = [];

        messageHistory.forEach((msg) => {
            const plainText =
                typeof msg.content === "string"
                    ? msg.content
                    : JSON.stringify(msg.content);

            validHistory.push({
                role: msg.role === "bot" ? "model" : "user",
                parts: [{ text: plainText }],
            });
        });

        return validHistory;
    }

    // 🔍 Nhận diện tên phim chính xác từ lịch sử
    extractMovieName(userMessage, recentHistory) {
        // Tìm các phim trong message hiện tại
        let movieName = null;

        // Pattern 1: "phim [tên]"
        const match1 = userMessage.match(/phim\s+["']?([^"'?!,.]+)["']?/i);
        if (match1 && match1[1] && !["đó", "này", "nào"].includes(match1[1].trim().toLowerCase())) {
            return match1[1].trim();
        }

        // Pattern 2: Nếu là "phim đó" -> lấy từ history
        if (userMessage.toLowerCase().includes("phim")) {
            for (let i = recentHistory.length - 1; i >= 0; i--) {
                const histMsg = recentHistory[i];
                const match = histMsg.match(/phim\s+["']?([^"'?!,.]+)["']?/i);
                if (match && match[1]) {
                    movieName = match[1].trim();
                    break;
                }
            }
        }

        return movieName;
    }

    // 🏢 Nhận diện tên rạp chính xác từ lịch sử
    extractTheaterName(userMessage, recentHistory) {
        let theaterName = null;

        // Pattern 1: "rạp [tên]"
        const match1 = userMessage.match(/rạp\s+([a-zA-Z0-9\s]+?)(?:\.|,|\?|$)/i);
        if (match1 && match1[1] && !["đó", "nào", "không"].includes(match1[1].trim().toLowerCase())) {
            return match1[1].trim();
        }

        // Pattern 2: Nếu là "rạp đó" -> lấy từ history
        if (userMessage.toLowerCase().includes("rạp")) {
            for (let i = recentHistory.length - 1; i >= 0; i--) {
                const histMsg = recentHistory[i];
                const match = histMsg.match(/rạp\s+([a-zA-Z0-9\s]+?)(?:\.|,|\?|$)/i);
                if (match && match[1]) {
                    theaterName = match[1].trim();
                    break;
                }
            }
        }

        return theaterName;
    }

    // 🎯 Tìm lịch chiếu từ phim + rạp
    findSchedule(movieName, theaterName, schedules) {
        return schedules.find(
            (s) =>
                s.movie?.title?.toLowerCase().includes(movieName.toLowerCase()) &&
                s.theater?.name?.toLowerCase().includes(theaterName.toLowerCase())
        );
    }

    // 💾 Lưu chat history vào DB
    async saveChatMessage(sessionId, userId, userName, role, content, type, data) {
        try {
            let history = await ChatHistory.findOne({ sessionId });

            if (!history) {
                history = new ChatHistory({
                    sessionId,
                    userId: userId || null,
                    userName,
                    messages: [],
                });
            }

            history.messages.push({
                role,
                content,
                type,
                data,
                timestamp: new Date(),
            });

            history.lastActivity = new Date();
            await history.save();

            return history;
        } catch (error) {
            console.error("❌ Error saving chat history:", error);
        }
    }

    // 📖 Lấy lịch sử chat
    async getChatHistory(sessionId, limit = 30) {
        try {
            const history = await ChatHistory.findOne({ sessionId });
            if (!history) return [];

            return history.messages.slice(-limit);
        } catch (error) {
            console.error("❌ Error fetching chat history:", error);
            return [];
        }
    }

    // 🧹 Cleanup old sessions
    async cleanupOldSessions(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        const result = await ChatHistory.deleteMany({ lastActivity: { $lt: cutoffDate } });
        console.log(`🧹 Cleaned up ${result.deletedCount} old chat sessions`);
    }
}

export default new ChatService();