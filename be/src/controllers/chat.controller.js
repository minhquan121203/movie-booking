import OpenAI from "openai";
import Movie from "../models/movie.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import chatService from "../services/chat.service.js";

export const handleChat = async (req, res) => {
    const {
        userMessage,
        sessionId = `session_${Date.now()}_${Math.random()}`,
        userId = null,
        userName = "Khách VIP",
    } = req.body;

    try {
        // 1. Kiểm tra đầu vào
        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({
                botMessage: { text: "Bạn cần nói gì đó để tớ trả lời nhé!", type: "text", data: [] },
            });
        }

        // 2. Lấy API Key OpenRouter từ env
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error("❌ Thiếu OPENROUTER_API_KEY trong .env");
            return res.status(500).json({
                botMessage: { text: "⚠️ Hệ thống chatbot chưa được cấu hình key. Liên hệ admin!", type: "text", data: [] },
            });
        }

        // 3. Lấy dữ liệu ngữ cảnh (Phim, Rạp, Lịch chiếu)
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
        } catch (e) {
            console.error("❌ Lỗi fetch data:", e.message);
            contextData = { movies: [], theaters: [], rawSchedules: [] };
        }

        // 4. Tạo System Prompt (Giữ nguyên logic của fen)
        const systemPrompt = `
        Bạn là "CineBot" - trợ lý ảo thông minh của rạp chiếu phim CineBooking.
        Nhiệm vụ: Tư vấn phim, lịch chiếu, giá vé và đồ ăn.
        
        [DỮ LIỆU RẠP]:
        - Phim đang chiếu: ${contextData.movies.map(m => m.title).join(", ")}
        - Rạp: ${contextData.theaters.map(t => t.name).join(", ")}
        
        [QUY TẮC TRẢ VỀ JSON]:
        Bạn PHẢI trả về định dạng JSON thuần túy (không dùng markdown \`\`\`) với cấu trúc:
        {
          "response": "Câu trả lời thân thiện bằng tiếng Việt",
          "action": "chat" | "movie_list" | "schedule",
          "phim": "Tên phim nếu khách nhắc tới (hoặc null)",
          "rap": "Tên rạp nếu khách nhắc tới (hoặc null)"
        }
        Nếu khách hỏi về phim đang chiếu hoặc gợi ý phim, hãy để action là "movie_list".
        `;

        // 5. GỌI OPENROUTER AI
        console.log(`🤖 Đang gọi OpenRouter (Model: Llama 3)...`);
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
        });

        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" } // Ép AI trả về JSON chuẩn
        });

        const responseText = completion.choices[0].message.content;
        console.log("👉 AI Response:", responseText);

        // 6. XỬ LÝ PHẢN HỒI
        let aiData;
        try {
            aiData = JSON.parse(responseText);
        } catch (e) {
            aiData = { response: responseText, action: "chat" };
        }

        let botResponse = {
            text: aiData.response || "Dạ, tớ đây!",
            type: "text",
            data: []
        };

        // 7. GHÉP DỮ LIỆU THẬT VÀO CARD (Logic vuốt vuốt xịn xò)
        if (aiData.action === "movie_list") {
            botResponse.type = "movie_list";
            botResponse.data = contextData.movies.map(m => ({
                _id: m._id,
                title: m.title,
                poster: m.poster,
                genre: m.genres?.map(g => g.name).join(", ") || "Phim hay"
            })).slice(0, 6);
        }
        else if (aiData.action === "schedule") {
            // Có thể thêm logic lọc lịch chiếu ở đây nếu muốn
            botResponse.text += " Bạn xem lịch chiếu phía dưới nhé!";
        }

        // 8. LƯU LỊCH SỬ CHAT
        try {
            await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
            await chatService.saveChatMessage(sessionId, userId, userName, "bot", botResponse.text, botResponse.type, botResponse.data);
        } catch (err) {
            console.warn("⚠️ Không lưu được lịch sử chat:", err.message);
        }

        // 9. TRẢ VỀ CHO FRONTEND
        return res.json({ botMessage: botResponse, sessionId });

    } catch (error) {
        console.error("❌ LỖI CHATBOT:", error.message);
        return res.status(500).json({
            botMessage: {
                text: "Tớ đang bảo trì não một chút, fen đợi tí nhé!",
                type: "text",
                data: []
            },
            error: error.message
        });
    }
};