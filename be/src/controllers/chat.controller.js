import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Schedule from "../models/schedule.model.js";
import ChatHistory from "../models/chat-history.model.js";
import chatService from "../services/chat.service.js";

export const handleChat = async (req, res) => {
    const {
        userMessage,
        sessionId = `session_${Date.now()}`,
        userId = null,
        userName = "Khách VIP",
    } = req.body;

    try {
        // 1️⃣ VALIDATE INPUT
        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({
                botMessage: {
                    text: "Bạn cần nói gì đó để tớ trả lời nhé!",
                    type: "text",
                    data: [],
                },
            });
        }

        // 2️⃣ GET ACTIVE API KEY
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) {
            return res.status(500).json({
                botMessage: {
                    text: "Hệ thống đang bảo trì AI, quay lại sau nhé!",
                    type: "text",
                    data: [],
                },
            });
        }

        // 3️⃣ FETCH CONTEXT DATA
        const contextData = await chatService.fetchContextData();
        const formattedText = chatService.formatContextText(contextData);
        const systemPrompt = chatService.createSystemPrompt(userName, formattedText);

        // 4️⃣ GET CHAT HISTORY
        const previousMessages = await chatService.getChatHistory(sessionId, 10);
        const recentChats = previousMessages
            .map((msg) => `${msg.role === "user" ? "Khách" : "Bot"}: ${msg.content}`)
            .join("\n");

        // 5️⃣ EXTRACT MOVIE & THEATER NAME
        const movieName = chatService.extractMovieName(userMessage, [
            recentChats,
        ]);
        const theaterName = chatService.extractTheaterName(userMessage, [
            recentChats,
        ]);

        console.log(`🎯 Nhận diện: Phim=[${movieName}], Rạp=[${theaterName}]`);

        // 6️⃣ CALL GEMINI API WITH STRUCTURED OUTPUT
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
${systemPrompt}

[LỊCH SỬ GẦN NHẤT]
${recentChats || "Không có"}

[CÂU HIỆN TẠI]
"${userMessage}"

👇 TRẢ VỀ JSON CHÍNH XÁC (Không markdown, không backtick):
{
  "phan_loai": "tim_lich_chieu|goi_y_phim|dat_ve|tro_chuyen",
  "cau_tra_loi": "Câu trả lời bằng tiếng Việt",
  "phim_tim_kiem": "${movieName || "null"}",
  "rap_tim_kiem": "${theaterName || "null"}"
}`;

        let response = await model.generateContent(prompt);
        let responseText = response.response.text().trim();

        // 7️⃣ PARSE JSON & CLEAN UP
        responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

        let botResponse = { text: "", type: "text", data: [] };
        let actionType = "tro_chuyen";

        try {
            const aiData = JSON.parse(responseText);
            actionType = aiData.phan_loai || "tro_chuyen";
            let phimDaNhanDien = aiData.phim_tim_kiem;
            let rapDaNhanDien = aiData.rap_tim_kiem;

            console.log(`📊 AI Phân loại: ${actionType}`);

            // 8️⃣ LOGIC XỬ LÝ HÀNH ĐỘNG
            if (actionType === "tim_lich_chieu" && phimDaNhanDien) {
                // Tìm phim trong DB
                const foundMovies = await Movie.find({
                    title: new RegExp(phimDaNhanDien, "i"),
                    status: "Đang chiếu",
                });

                if (foundMovies.length > 0 && rapDaNhanDien) {
                    // Tìm lịch chiếu cụ thể
                    const schedule = await Schedule.findOne({
                        movie: foundMovies[0]._id,
                        theater: { $regex: rapDaNhanDien, $options: "i" },
                    })
                        .populate("movie", "title")
                        .populate("theater", "name");

                    if (schedule) {
                        botResponse.text = `🎬 **${schedule.movie.title}** tại **${schedule.theater.name}** còn **${schedule.availableSeats} ghế** nhé!`;
                    } else {
                        botResponse.text = `Không tìm thấy lịch chiếu phim "${phimDaNhanDien}" tại rạp "${rapDaNhanDien}". Bạn đổi rạp khác không?`;
                    }
                } else if (foundMovies.length > 0) {
                    botResponse.text = `🎬 Phim **${foundMovies[0].title}** đang chiếu. Bạn muốn xem ở rạp nào?`;
                } else {
                    botResponse.text = aiData.cau_tra_loi;
                }
                botResponse.type = "text";
            } else if (actionType === "goi_y_phim") {
                botResponse.text = aiData.cau_tra_loi;
                botResponse.type = "movie_list";

                // Lấy một vài bộ phim ngẫu nhiên
                const randomMovies = await Movie.find({ status: "Đang chiếu" })
                    .populate("genres", "name")
                    .limit(3);

                botResponse.data = randomMovies.map((m) => ({
                    _id: m._id,
                    title: m.title,
                    genre:
                        m.genres && m.genres.length > 0
                            ? m.genres.map((g) => g.name).join(", ")
                            : "Chưa cập nhật",
                    poster:
                        m.posterUrl ||
                        m.image ||
                        m.thumbnail ||
                        "https://placehold.co/150x200?text=No+Poster",
                }));
            } else {
                botResponse.text = aiData.cau_tra_loi || "Tớ không hiểu, bạn nói rõ hơn nhé!";
                botResponse.type = "text";
            }
        } catch (parseError) {
            console.warn("⚠️ JSON Parse Error:", parseError.message);
            botResponse.text = responseText;
            botResponse.type = "text";
        }

        // 9️⃣ SAVE TO DB
        await chatService.saveChatMessage(
            sessionId,
            userId,
            userName,
            "user",
            userMessage,
            "text",
            null
        );

        await chatService.saveChatMessage(
            sessionId,
            userId,
            userName,
            "bot",
            botResponse.text,
            botResponse.type,
            botResponse.data
        );

        // 🔟 RESPONSE
        res.json({ botMessage: botResponse, sessionId });
    } catch (error) {
        console.error("❌ Chat Error:", error);

        // Handle 429 error
        if (error.message && error.message.includes("429")) {
            chatService.rotateKeyOnError();
            return res.json({
                botMessage: {
                    text: "Hệ thống vừa tự động nâng cấp. Bạn gửi lại tin nhắn nhé!",
                    type: "text",
                    data: [],
                },
            });
        }

        res.status(500).json({
            botMessage: {
                text: "Tớ đang bị chậm xíu, bạn thử lại nhé!",
                type: "text",
                data: [],
            },
        });
    }
};

export default { handleChat };