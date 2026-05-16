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

    // Thử qua tất cả các API key
    for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) break;

        const genAI = new GoogleGenerativeAI(apiKey);
        console.log(`🔑 Đang dùng key #${chatService.currentKeyIndex + 1} (${apiKey.substring(0, 8)}...)`);

        // Thử từng model với key này
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

                // 404 = model không tồn tại → thử model khác (cùng key)
                if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
                    console.warn(`⚠️ Model ${modelName} không khả dụng, thử model tiếp...`);
                    continue;
                }

                // 429 = rate limit → rotate key, break ra vòng ngoài để thử key mới
                if (msg.includes("429") || err.status === 429) {
                    console.warn(`⚠️ Key #${chatService.currentKeyIndex + 1} bị rate limit, xoay key...`);
                    chatService.rotateKeyOnError();
                    break; // thoát vòng model, quay lại vòng key
                }

                // 403 = key bị cấm hoặc hết quota → rotate key
                if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("quota")) {
                    console.warn(`⚠️ Key #${chatService.currentKeyIndex + 1} bị từ chối/hết quota, xoay key...`);
                    chatService.rotateKeyOnError();
                    break;
                }

                // Lỗi mạng / unknown → thử model tiếp
                console.warn(`⚠️ Lỗi không xác định với ${modelName}: ${msg.substring(0, 100)}`);
                continue;
            }
        }
    }

    // Nếu tất cả key × model đều thất bại
    throw lastError || new Error("ALL_KEYS_EXHAUSTED");
}

/**
 * Fallback thông minh: khi Gemini hoàn toàn không khả dụng,
 * phân tích câu hỏi bằng keyword matching và trả data trực tiếp từ DB.
 */
function buildSmartFallback(userMessage, contextData) {
    const msg = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const msgOriginal = userMessage.toLowerCase();

    // Kiểm tra hỏi về phim
    const movieKeywords = ["phim", "xem gi", "xem gì", "dang chieu", "đang chiếu", "goi y", "gợi ý", "co phim", "có phim", "chieu gi", "chiếu gì"];
    if (movieKeywords.some(kw => msgOriginal.includes(kw) || msg.includes(kw))) {
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
                    const d = new Date(s.startTime);
                    return `- ${s.movie?.title || "?"} @ ${s.theater?.name || "?"} | ${d.toLocaleString("vi-VN")}`;
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

    // Kiểm tra hỏi về khuyến mãi / voucher
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

    // Mặc định: giới thiệu khả năng
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

        // 1. Fetch Data từ DB (luôn fetch trước, bất kể Gemini có hoạt động không)
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
            console.log(`📊 DB: ${contextData.movies?.length || 0} phim, ${contextData.theaters?.length || 0} rạp, ${contextData.products?.length || 0} sản phẩm, ${contextData.rawSchedules?.length || 0} lịch chiếu`);
        } catch (e) {
            console.error("❌ Lỗi fetch DB:", e.message);
            contextData = { movies: [], theaters: [], rawSchedules: [], products: [], vouchers: [] };
        }

        // 2. Kiểm tra API Key
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey || !chatService.hasValidKeys()) {
            // Không có key → dùng fallback thông minh từ DB
            console.warn("⚠️ Không có API key, dùng fallback từ DB");
            const fallback = buildSmartFallback(userMessage, contextData);
            return res.json({ botMessage: fallback, sessionId });
        }

        // 3. Tạo System Prompt chi tiết từ service
        const formattedText = chatService.formatContextText(contextData);
        const systemPrompt = chatService.createSystemPrompt(userName, formattedText);

        const jsonFormat = `
        LUÔN trả về JSON thuần túy theo format sau (KHÔNG markdown, KHÔNG code block):
        {
        "response": "Câu trả lời thân thiện dựa trên DỮ LIỆU THỰC TẾ ở trên",
        "action": "chat" hoặc "movie_list" hoặc "schedule" hoặc "product_list",
        "phim": "Tên phim nếu có hoặc null",
        "rap": "Tên rạp nếu có hoặc null"
        }`;

        const prompt = `${systemPrompt}\n\n${jsonFormat}\n\nKhách nói: "${userMessage}"`;

        // 4. GỌI GEMINI VỚI FULL RETRY (tất cả key × tất cả model)
        let result;
        let useGeminiFailed = false;

        try {
            result = await callGeminiWithFullRetry(prompt);
        } catch (geminiError) {
            console.error("❌ Tất cả Gemini key/model đều thất bại:", geminiError.message);
            useGeminiFailed = true;
        }

        // 5. Nếu Gemini thất bại hoàn toàn → dùng fallback thông minh từ DB
        if (useGeminiFailed || !result) {
            console.log("🔄 Dùng fallback thông minh từ dữ liệu DB");
            const fallback = buildSmartFallback(userMessage, contextData);

            // Lưu lịch sử
            try {
                await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
                await chatService.saveChatMessage(sessionId, userId, userName, "bot", fallback.text, fallback.type, fallback.data);
            } catch (err) {
                console.warn("⚠️ Lỗi lưu chat history:", err.message);
            }

            return res.json({ botMessage: fallback, sessionId });
        }

        // 6. XỬ LÝ RESPONSE TỪ GEMINI
        const responseText = result.response.text();
        console.log("📝 Gemini raw response:", responseText.substring(0, 300));

        let aiData;
        try {
            aiData = JSON.parse(responseText);
        } catch (e) {
            console.warn("⚠️ Gemini trả về không phải JSON:", responseText.substring(0, 200));
            aiData = { response: responseText || "Tớ chưa hiểu ý bạn, bạn nói lại nhé!", action: "chat" };
        }

        let botResponse = { text: aiData.response, type: "text", data: [] };

        // Logic UI Vuốt ngang (Card Phim)
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

        // Logic hiển thị sản phẩm (bắp nước)
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

        // Logic hiển thị lịch chiếu
        if (aiData.action === "schedule") {
            botResponse.type = "schedule";
            const filteredSchedules = (contextData.rawSchedules || [])
                .filter(s => s.movie && s.theater)
                .slice(0, 10);

            if (filteredSchedules.length > 0) {
                botResponse.data = filteredSchedules.map(s => ({
                    movieTitle: s.movie?.title || "?",
                    theaterName: s.theater?.name || "?",
                    startTime: s.startTime,
                }));
            }
        }

        // Lưu lịch sử chat
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