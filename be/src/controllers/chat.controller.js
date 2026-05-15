import { GoogleGenerativeAI } from "@google/generative-ai";
import chatService from "../services/chat.service.js";

// Danh sách model theo thứ tự ưu tiên — nếu model đầu lỗi sẽ tự fallback xuống model kế tiếp
const MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];

/**
 * Gọi Gemini với cơ chế fallback model: nếu model hiện tại 404/không khả dụng,
 * sẽ tự động thử model tiếp theo trong danh sách.
 */
async function callGeminiWithFallback(genAI, prompt, models = MODEL_CANDIDATES) {
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`🤖 Thử gọi model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" },
            });
            const result = await model.generateContent(prompt);
            console.log(`✅ Thành công với model: ${modelName}`);
            return result;
        } catch (err) {
            lastError = err;
            const msg = err.message || "";
            // Nếu lỗi 404 (model not found) hoặc model không hỗ trợ → thử model kế tiếp
            if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
                console.warn(`⚠️ Model ${modelName} không khả dụng, thử model tiếp theo...`);
                continue;
            }
            // Các lỗi khác (429 rate limit, network, v.v.) → ném ra ngoài xử lý
            throw err;
        }
    }

    // Nếu không model nào dùng được
    throw lastError || new Error("Không có model Gemini nào khả dụng.");
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

        // 1. Lấy API Key từ Service (Đã có logic xoay vòng Key)
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) {
            return res.status(500).json({
                botMessage: { text: "⚠️ Hệ thống chưa cài API Key.", type: "text", data: [] },
            });
        }

        // 2. Fetch Data Rạp Phim
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
        } catch (e) {
            contextData = { movies: [], theaters: [], rawSchedules: [], products: [], vouchers: [] };
        }

        // 3. Tạo System Prompt chi tiết từ service
        const formattedText = chatService.formatContextText(contextData);
        const systemPrompt = chatService.createSystemPrompt(userName, formattedText);

        const jsonFormat = `
        LUÔN trả về JSON thuần túy theo format sau (KHÔNG markdown, KHÔNG code block):
        {
        "response": "Câu trả lời thân thiện",
        "action": "chat" hoặc "movie_list" hoặc "schedule" hoặc "product_list",
        "phim": "Tên phim nếu có hoặc null",
        "rap": "Tên rạp nếu có hoặc null"
        }`;

        const prompt = `${systemPrompt}\n\n${jsonFormat}\n\nKhách nói: "${userMessage}"`;

        // 4. GỌI GEMINI VỚI FALLBACK MODEL
        console.log(`🤖 Đang gọi Gemini (Key bắt đầu bằng: ${apiKey.substring(0, 8)}...)`);
        const genAI = new GoogleGenerativeAI(apiKey);

        let result;
        try {
            result = await callGeminiWithFallback(genAI, prompt);
        } catch (geminiError) {
            // NẾU BỊ QUÁ TẢI (429) -> TỰ ĐỘNG XOAY KEY VÀ BÁO FRONTEND
            if (
                geminiError.message?.includes("429") ||
                geminiError.status === 429
            ) {
                chatService.rotateKeyOnError();
                return res.json({
                    botMessage: {
                        text: "Hệ thống đang đông, tớ vừa đổi não bộ. Bạn gửi lại tin nhắn vừa rồi nhé!",
                        type: "text",
                        data: [],
                    },
                    sessionId,
                });
            }
            throw geminiError;
        }

        const responseText = result.response.text();

        // 5. XỬ LÝ DỮ LIỆU TRẢ VỀ
        let aiData;
        try {
            aiData = JSON.parse(responseText);
        } catch (e) {
            // Nếu Gemini trả text không phải JSON → fallback
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
                    poster: m.poster,
                    genre: m.genres?.map((g) => g.name).join(", ") || "Phim rạp",
                }))
                .slice(0, 6);
        }

        // Logic hiển thị sản phẩm (bắp nước)
        if (aiData.action === "product_list") {
            botResponse.type = "product_list";
            botResponse.data = (contextData.products || [])
                .map((p) => ({
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    image: p.image,
                }))
                .slice(0, 6);
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
        console.error("❌ LỖI CHATBOT:", error.message);
        return res.status(500).json({
            botMessage: {
                text: "Xin lỗi bạn, hệ thống chatbot đang gặp sự cố. Vui lòng thử lại sau ít phút nhé! 🙏",
                type: "text",
                data: [],
            },
        });
    }
};