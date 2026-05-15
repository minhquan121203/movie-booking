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
            console.error("GEMINI_API_KEYS value:", process.env.GEMINI_API_KEYS);
            return res.status(500).json({
                botMessage: {
                    text: "⚠️ Hệ thống chatbot chưa được cấu hình. Vui lòng liên hệ admin!",
                    type: "text",
                    data: [],
                },
                error: {
                    message: "Missing GEMINI_API_KEYS in environment",
                    step: "api_key_validation"
                }
            });
        }
        console.log(`✅ Using API key index: ${chatService.currentKeyIndex}`);

        // 3️⃣ FETCH DATA
        console.log(`📊 Fetching context data...`);
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
            console.log(`✅ Context data fetched - Movies: ${contextData.movies?.length || 0}, Theaters: ${contextData.theaters?.length || 0}, Schedules: ${contextData.rawSchedules?.length || 0}`);

            // Validate data
            if (!contextData.movies || contextData.movies.length === 0) {
                console.warn("⚠️ No movies found in database");
            }
            if (!contextData.theaters || contextData.theaters.length === 0) {
                console.warn("⚠️ No theaters found in database");
            }
        } catch (fetchError) {
            console.error("❌ Error in fetchContextData:", fetchError.message);
            console.error("Stack:", fetchError.stack);
            throw new Error(`Data fetch failed: ${fetchError.message}`);
        }

        console.log(`🎯 Formatting text...`);
        let formattedText, systemPrompt;
        try {
            formattedText = chatService.formatContextText(contextData);

            // Validate formatted text
            if (!formattedText.moviesText) formattedText.moviesText = "Không có phim";
            if (!formattedText.theatersText) formattedText.theatersText = "Không có rạp";
            if (!formattedText.schedulesText) formattedText.schedulesText = "Không có lịch chiếu";

            systemPrompt = chatService.createSystemPrompt(userName, formattedText);
            console.log(`✅ System prompt created (length: ${systemPrompt.length} chars)`);
        } catch (formatError) {
            console.error("❌ Error formatting text:", formatError.message);
            console.error("Stack:", formatError.stack);
            throw new Error(`Prompt creation failed: ${formatError.message}`);
        }

        // 4️⃣ GET HISTORY
        const previousMessages = await chatService.getChatHistory(sessionId, 15);
        const recentChats = previousMessages
            .map((msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`)
            .join("\n");

        // 5️⃣ EXTRACT ENTITIES
        const movieName = chatService.extractMovieName(userMessage);
        const theaterName = chatService.extractTheaterName(userMessage);

        console.log(`🎯 Nhận diện: Phim=[${movieName}], Rạp=[${theaterName}]`);

        // 6️⃣ CALL GEMINI
        console.log(`🤖 Calling Gemini API...`);
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

        let result;
        try {
            result = await model.generateContent(prompt);
            console.log(`✅ Gemini response received`);
        } catch (geminiError) {
            console.error("❌ Gemini API Error:", geminiError.message);
            console.error("Error status:", geminiError.status);
            console.error("Error details:", geminiError);

            if (geminiError.message?.includes("429")) {
                chatService.rotateKeyOnError();
                return res.json({
                    botMessage: {
                        text: "Hệ thống đang quá tải. Vui lòng thử lại sau 30 giây nhé!",
                        type: "text",
                        data: [],
                    },
                });
            }
            throw new Error(`Gemini API failed: ${geminiError.message}`);
        }

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
        console.log(`💾 Saving to database...`);
        try {
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
            console.log(`✅ Messages saved to DB`);
        } catch (saveError) {
            console.warn("⚠️ Warning: Could not save to DB:", saveError.message);
            // Don't throw - still return response even if DB save fails
        }

        // 🔟 RESPONSE
        res.json({ botMessage: botResponse, sessionId });
  } catch (error) {
    console.error("❌ ============ CHAT ERROR ============");
    console.error(`❌ Error Type: ${error.constructor.name}`);
    console.error(`❌ Error Message: ${error.message}`);
    console.error(`❌ Error Stack:`, error.stack);

    if (error.response?.status) {
      console.error(`❌ Status Code: ${error.response.status}`);
      console.error(`❌ Response Data:`, error.response.data);
    }

    let errorStep = "unknown";
    if (error.message?.includes("Data fetch")) errorStep = "database_query";
    if (error.message?.includes("Prompt")) errorStep = "prompt_creation";
    if (error.message?.includes("Gemini")) errorStep = "gemini_api";
    if (error.message?.includes("JSON")) errorStep = "json_parsing";

    // Check if it's 429 (rate limit)
    if (error.message?.includes("429")) {
      chatService.rotateKeyOnError();
      return res.json({
        botMessage: {
          text: "🔄 Hệ thống tự động chuyển sang API khác. Thử lại nhé!",
          type: "text",
          data: [],
        },
      });
    }

    // Return detailed error in dev mode
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      botMessage: {
        text: isDev
          ? `❌ Lỗi: ${error.message}`
          : "Tớ gặp chút sự cố, bạn thử lại nhé!",
        type: "text",
        data: [],
      },
      error: isDev ? {
        message: error.message,
        type: error.constructor.name,
        step: errorStep,
        timestamp: new Date().toISOString(),
      } : undefined,
    });
  }
};

export default { handleChat };