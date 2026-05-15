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
    }

    getActiveApiKey() {
        return this.apiKeys[this.currentKeyIndex];
    }

    rotateKeyOnError() {
        if (this.apiKeys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            console.log(`✅ Chuyển sang API key #${this.currentKeyIndex + 1}`);
        }
    }

    async fetchContextData() {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        try {
            const [movies, theaters, rawSchedules, products, vouchers] =
                await Promise.all([
                    Movie.find({ status: "Đang chiếu" }).populate("genres", "name").lean().catch(e => {
                        console.warn("⚠️ Error fetching movies:", e.message);
                        return [];
                    }),
                    Theater.find({ isActive: true }).lean().catch(e => {
                        console.warn("⚠️ Error fetching theaters:", e.message);
                        return [];
                    }),

                    // Query lịch chiếu - loại bỏ filter status nếu không tồn tại
                    Schedule.find({
                        startTime: { $gte: now, $lte: next7Days }
                    })
                        .populate("movie", "title")
                        .populate("theater", "name")
                        .sort({ startTime: 1 })
                        .lean()
                        .catch(e => {
                            console.warn("⚠️ Error fetching schedules:", e.message);
                            return [];
                        }),
                    Product.find().lean().catch(e => {
                        console.warn("⚠️ Error fetching products:", e.message);
                        return [];
                    }),
                    Voucher.find({ isActive: true }).lean().catch(e => {
                        console.warn("⚠️ Error fetching vouchers:", e.message);
                        return [];
                    }),
                ]);

            return { movies, theaters, rawSchedules, products, vouchers, now, next7Days };
        } catch (error) {
            console.error("❌ Error in fetchContextData:", error.message);
            return { movies: [], theaters: [], rawSchedules: [], products: [], vouchers: [], now: new Date(), next7Days: new Date() };
        }
    }

    formatContextText(data) {
        const { movies, theaters, rawSchedules, products, vouchers, now, next7Days } = data;

        const moviesText =
            movies && movies.length > 0
                ? movies
                    .slice(0, 5)
                    .map((m) => {
                        const genres =
                            m.genres && m.genres.length > 0
                                ? m.genres.map((g) => g.name).join(", ")
                                : "Đang cập nhật";
                        return `- ${m.title} | Thể loại: ${genres}`;
                    })
                    .join("\n")
                : "Không có phim nào";

        const theatersText =
            theaters && theaters.length > 0
                ? theaters.map((t) => `- ${t.name} (${t.city})`).join("\n")
                : "Không có rạp";

        const productsText =
            products && products.length > 0
                ? products.map((p) => `- ${p.name}: ${p.price} VNĐ`).join("\n")
                : "Hết bắp nước";

        const vouchersText =
            vouchers && vouchers.length > 0
                ? vouchers.map((v) => `- ${v.code}: Giảm ${v.discount}%`).join("\n")
                : "Không có khuyến mãi";

        const schedulesText =
            rawSchedules && rawSchedules.length > 0
                ? rawSchedules
                    .filter((s) => {
                        try {
                            const d = new Date(s.startTime);
                            return s.movie && s.theater && d >= now && d <= next7Days;
                        } catch (e) {
                            return false;
                        }
                    })
                    .slice(0, 5)
                    .map((s) => {
                        const d = new Date(s.startTime);
                        return `- ${s.movie?.title || "?"} @ ${s.theater?.name || "?"} | ${d.toLocaleTimeString("vi-VN")}`;
                    })
                    .join("\n")
                : "Chưa có lịch chiếu";

        return { moviesText, theatersText, productsText, vouchersText, schedulesText };
    }

    createSystemPrompt(userName, formattedText) {
        return `Bạn là CineBot - trợ lý ảo của hệ thống booking phim CineBooking.
Người dùng: ${userName}. Luôn xưng "tớ", gọi khách là "bạn" hoặc "${userName}".

📊 DỮ LIỆU HIỆN TẠI:
PHIM ĐANG CHIẾU: ${formattedText.moviesText}
RẠP PHIM: ${formattedText.theatersText}
BẮP & NƯỚC: ${formattedText.productsText}
KHUYẾN MÃI: ${formattedText.vouchersText}
LỊCH CHIẾU: ${formattedText.schedulesText}

HƯỚNG DẪN TRẢ LỜI:
✅ Sử dụng lịch sử cuộc hội thoại để hiểu ngữ cảnh
✅ Nếu khách hỏi "phim đó", hãy tham chiếu từ lịch sử đã nói
✅ Nhớ sở thích phim của khách từ các câu hỏi trước
✅ Chỉ cung cấp thông tin từ dữ liệu trên, KHÔNG bịa dặt
✅ Nếu khách hỏi ngoài, xin lỗi và chuyển hướng`;
    }

    extractMovieName(userMessage, history = []) {
        const match = userMessage.match(/phim\s+["']?([^"'?!,.]+)["']?/i);
        if (match && match[1] && !["đó", "này", "nào"].includes(match[1].trim().toLowerCase())) {
            return match[1].trim();
        }
        return null;
    }

    extractTheaterName(userMessage, history = []) {
        const match = userMessage.match(/rạp\s+([a-zA-Z0-9\s]+?)(?:\.|,|\?|!|$)/i);
        if (match && match[1] && !["đó", "nào"].includes(match[1].trim().toLowerCase())) {
            return match[1].trim();
        }
        return null;
    }

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
                type: type || "text",
                data: data || null,
                timestamp: new Date(),
            });

            history.lastActivity = new Date();
            await history.save();
            return history;
        } catch (error) {
            console.error("❌ Lỗi lưu chat history:", error);
        }
    }

    async getChatHistory(sessionId, limit = 10) {
        try {
            const history = await ChatHistory.findOne({ sessionId });
            if (!history) {
                console.log(`📝 No history found for session: ${sessionId}`);
                return [];
            }
            const recentMessages = history.messages.slice(-limit);
            console.log(`✅ Retrieved ${recentMessages.length} messages from history (limit: ${limit})`);
            return recentMessages;
        } catch (error) {
            console.error("❌ Lỗi lấy chat history:", error.message);
            return [];
        }
    }
}

export default new ChatService();