import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Schedule from "../models/schedule.model.js";
import chatService from "../services/chat.service.js";

export const handleChat = async (req, res) => {
    const {
        userMessage,
        sessionId = `session_${Date.now()}_${Math.random()}`,
        userId = null,
        userName = "Khách VIP",
    } = req.body;

    try {
        // 1️⃣ VALIDATE
        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({
                botMessage: {
                    text: "Bạn cần nói gì đó để tớ trả lời nhé!",
                    type: "text",
                    data: [],
                },
            });
        }

        // 2️⃣ GET API KEY
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) {
            console.error("❌ Không có GEMINI_API_KEYS trong .env");
            return res.status(500).json({
                botMessage: {
                    text: "Hệ thống đang bảo trì, quay lại sau nhé!",
                    type: "text",
                    data: [],
                },
            });
        }

        // 3️⃣ FETCH DATA
        const contextData = await chatService.fetchContextData();
        const formattedText = chatService.formatContextText(contextData);
        const systemPrompt = chatService.createSystemPrompt(userName, formattedText);

        // 4️⃣ GET HISTORY
        const previousMessages = await chatService.getChatHistory(sessionId, 5);
        const recentChats = previousMessages
            .map((msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`)
            .join("\n");

        // 5️⃣ EXTRACT ENTITIES
        const movieName = chatService.extractMovieName(userMessage);
        const theaterName = chatService.extractTheaterName(userMessage);

        console.log(`🎯 Nhận diện: Phim=[${movieName}], Rạp=[${theaterName}]`);

        // 6️⃣ CALL GEMINI
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
${systemPrompt}

[LỊCH SỬ]
${recentChats || "Chưa có"}

[CÂU HIỆN TẠI]
"${userMessage}"

👇 TRẢ VỀ JSON (chỉ JSON, không markdown):
{
  "response": "Trả lời tiếng Việt",
  "action": "chat|movie_list|schedule",
  "phim": "${movieName || "null"}",
  "rap": "${theaterName || "null"}"
}`;

        let result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // 7️⃣ PARSE JSON
        responseText = responseText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        let botResponse = {
            text: "Tớ đang tải dữ liệu, bạn thử lại nhé!",
            type: "text",
            data: [],
        };

        try {
            const aiData = JSON.parse(responseText);

            let actionType = aiData.action || "chat";
            let phimDaNhanDien = aiData.phim;
            let rapDaNhanDien = aiData.rap;

            // 8️⃣ XỬ LÝ THEO HÀNH ĐỘNG
            if (
                (actionType === "schedule" || actionType === "movie_list") &&
                phimDaNhanDien
            ) {
                const foundMovies = await Movie.find({
                    title: new RegExp(phimDaNhanDien, "i"),
                    status: "Đang chiếu",
                }).lean();

                if (foundMovies.length > 0 && rapDaNhanDien) {
                    const schedule = await Schedule.findOne({
                        movie: foundMovies[0]._id,
                    })
                        .populate("movie", "title")
                        .populate("theater", "name")
                        .lean();

                    if (schedule) {
                        botResponse.text = `🎬 **${schedule.movie.title}** @ **${schedule.theater.name}** - ${schedule.availableSeats} ghế trống`;
                        botResponse.type = "text";
                    } else {
                        botResponse.text = `Không tìm thấy lịch chiếu phim "${phimDaNhanDien}". Bạn thử tên khác?`;
                    }
                } else if (foundMovies.length > 0) {
                    botResponse.text = `🎬 Phim **${foundMovies[0].title}** đang chiếu. Bạn muốn xem ở rạp nào?`;
                } else {
                    botResponse.text = aiData.response;
                }
            } else if (actionType === "movie_list") {
                botResponse.text = aiData.response;
                botResponse.type = "movie_list";

                const randomMovies = await Movie.find({ status: "Đang chiếu" })
                    .populate("genres", "name")
                    .limit(3)
                    .lean();

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
                        "https://placehold.co/150x200?text=No+Poster",
                }));
            } else {
                botResponse.text = aiData.response || "Tớ hiểu câu hỏi của bạn rồi!";
                botResponse.type = "text";
            }
        } catch (parseError) {
            console.warn("⚠️ JSON Parse Error:", parseError.message);
            botResponse.text = responseText || "Xin lỗi, tớ tạm hiểu không rõ!";
        }

        // 9️⃣ LƯU DB
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

        if (error.message && error.message.includes("429")) {
            chatService.rotateKeyOnError();
            return res.json({
                botMessage: {
                    text: "Hệ thống tự động nâng cấp. Bạn gửi lại nhé!",
                    type: "text",
                    data: [],
                },
            });
        }

        res.status(500).json({
            botMessage: {
                text: "Tớ gặp chút sự cố, bạn thử lại nhé!",
                type: "text",
                data: [],
            },
        });
    }
};

export default { handleChat };