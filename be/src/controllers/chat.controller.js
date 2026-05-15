import { GoogleGenerativeAI } from "@google/generative-ai";
import chatService from "../services/chat.service.js";

export const handleChat = async (req, res) => {
    const {
        userMessage,
        sessionId = `session_${Date.now()}_${Math.random()}`,
        userId = null,
        userName = "Khách VIP",
    } = req.body;

    try {
        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({ botMessage: { text: "Bạn cần nói gì đó để tớ trả lời nhé!", type: "text", data: [] } });
        }

        // 1. Lấy API Key từ Service (Đã có logic xoay vòng Key của fen)
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) {
            return res.status(500).json({ botMessage: { text: "⚠️ Hệ thống chưa cài API Key.", type: "text", data: [] } });
        }

        // 2. Fetch Data Rạp Phim
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
        } catch (e) {
            contextData = { movies: [], theaters: [], rawSchedules: [] };
        }

        const systemPrompt = `Bạn là "CineBot" - trợ lý ảo của CineBooking.
        [PHIM ĐANG CHIẾU]: ${contextData.movies.map(m => m.title).join(", ")}
        [QUY TẮC]:
        Trát về JSON thuần túy theo format sau:
        {
          "response": "Câu trả lời thân thiện",
          "action": "chat" hoặc "movie_list" hoặc "schedule",
          "phim": "Tên phim nếu có hoặc null",
          "rap": "Tên rạp nếu có hoặc null"
        }`;

        // 3. GỌI GEMINI VỚI CHẾ ĐỘ ÉP JSON
        console.log(`🤖 Đang gọi Gemini (Key bắt đầu bằng: ${apiKey.substring(0, 8)}...)`);
        const genAI = new GoogleGenerativeAI(apiKey);

        // Dùng bản 1.5 flash chuẩn, bật chế độ ép JSON
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${systemPrompt}\n\nKhách nói: "${userMessage}"`;

        let result;
        try {
            result = await model.generateContent(prompt);
        } catch (geminiError) {
            // NẾU BỊ QUÁ TẢI (429) -> TỰ ĐỘNG XOAY KEY VÀ BÁO FRONTEND
            if (geminiError.message.includes("429") || geminiError.status === 429) {
                chatService.rotateKeyOnError();
                return res.json({
                    botMessage: { text: "Hệ thống đang đông, tớ vừa đổi não bộ. Bạn gửi lại tin nhắn vừa rồi nhé!", type: "text", data: [] },
                    sessionId
                });
            }
            throw geminiError;
        }

        const responseText = result.response.text();

        // 4. XỬ LÝ DỮ LIỆU
        let aiData;
        try {
            aiData = JSON.parse(responseText);
        } catch (e) {
            aiData = { response: "Tớ chưa hiểu ý bạn, bạn nói lại nhé!", action: "chat" };
        }

        let botResponse = { text: aiData.response, type: "text", data: [] };

        // Logic UI Vuốt ngang (Card Phim)
        if (aiData.action === "movie_list") {
            botResponse.type = "movie_list";
            botResponse.data = contextData.movies.map(m => ({
                _id: m._id,
                title: m.title,
                poster: m.poster,
                genre: m.genres?.map(g => g.name).join(", ") || "Phim rạp"
            })).slice(0, 6);
        }

        // Lưu lịch sử chat
        try {
            await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
            await chatService.saveChatMessage(sessionId, userId, userName, "bot", botResponse.text, botResponse.type, botResponse.data);
        } catch (err) {}

        return res.json({ botMessage: botResponse, sessionId });

    } catch (error) {
        console.error("❌ LỖI CHATBOT:", error.message);
        return res.status(500).json({
            botMessage: { text: "Lỗi nội bộ: " + error.message, type: "text", data: [] }
        });
    }
};