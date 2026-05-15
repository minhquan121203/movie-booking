import { GoogleGenerativeAI } from "@google/generative-ai";
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
        // ─── 1. VALIDATE ────────────────────────────────────────────────────────
        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({
                botMessage: { text: "Bạn cần nói gì đó để tớ trả lời nhé!", type: "text", data: [] },
            });
        }

        // ─── 2. API KEY ──────────────────────────────────────────────────────────
        const apiKey = chatService.getActiveApiKey();
        if (!apiKey) {
            console.error("❌ Thiếu GEMINI_API_KEYS trong .env");
            return res.status(500).json({
                botMessage: { text: "⚠️ Hệ thống chatbot chưa được cấu hình. Vui lòng liên hệ admin!", type: "text", data: [] },
            });
        }

        // ─── 3. FETCH DATA ───────────────────────────────────────────────────────
        let contextData;
        try {
            contextData = await chatService.fetchContextData();
        } catch (e) {
            console.error("❌ fetchContextData lỗi:", e.message);
            contextData = { movies: [], theaters: [], rawSchedules: [], products: [], vouchers: [], now: new Date(), next7Days: new Date() };
        }

        // ─── 4. BUILD PROMPT ─────────────────────────────────────────────────────
        const formattedText = chatService.formatContextText(contextData);
        const systemPrompt = chatService.createSystemPrompt(userName, formattedText);

        // ─── 5. CHAT HISTORY ─────────────────────────────────────────────────────
        const previousMessages = await chatService.getChatHistory(sessionId, 15);
        const recentChats = previousMessages
            .map((msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`)
            .join("\n");

        // ─── 6. EXTRACT ENTITIES ─────────────────────────────────────────────────
        const movieName    = chatService.extractMovieName(userMessage);
        const theaterName  = chatService.extractTheaterName(userMessage);
        console.log(`🎯 Nhận diện: Phim=[${movieName}], Rạp=[${theaterName}]`);

        // ─── 7. CALL GEMINI ──────────────────────────────────────────────────────
        const prompt = `
        ${systemPrompt}
        
        [LỊCH SỬ HỘI THOẠI]
        ${recentChats || "Chưa có lịch sử"}
        
        [CÂU HỎI HIỆN TẠI]
        "${userMessage}"
        
        👇 CHỈ trả về JSON hợp lệ, KHÔNG markdown, KHÔNG giải thích:
        {
          "response": "Câu trả lời tiếng Việt thân thiện",
          "action": "chat | movie_list | schedule | product_list",
          "phim": ${JSON.stringify(movieName)},
          "rap": ${JSON.stringify(theaterName)}
        }`;

        // Call Gemini with retries and key rotation
        let result = null;
        const maxAttempts = Math.max(1, (chatService.apiKeys?.length || 0));
        let lastError = null;
        for (let attempt = 0; attempt < Math.max(3, maxAttempts); attempt++) {
            const activeKey = chatService.getActiveApiKey();
            if (!activeKey) break;
            try {
                const genAI = new GoogleGenerativeAI(activeKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
                result = await model.generateContent(prompt);
                // success
                break;
            } catch (geminiError) {
                lastError = geminiError;
                console.error(`❌ Gemini attempt ${attempt + 1} failed:`, geminiError.message || geminiError);
                const shouldRotate = true;
                if (shouldRotate && chatService.apiKeys && chatService.apiKeys.length > 1) {
                    chatService.rotateKeyOnError();
                    console.log(`🔁 Đang thử API key tiếp theo...`);
                    // small delay before retry
                    await new Promise((r) => setTimeout(r, 500));
                    continue;
                }
                // Non-retriable error
                break;
            }
        }
        if (!result) {
            console.error("❌ Gemini: tất cả attempt thất bại", lastError && lastError.message);
            // if rate-limited, inform user to retry; otherwise throw to be handled by outer catch
            if (lastError?.message?.includes("429") || lastError?.status === 429) {
                return res.json({ botMessage: { text: "Hệ thống đang quá tải, bạn thử lại sau 30 giây nhé!", type: "text", data: [] } });
            }
            throw lastError || new Error("Gemini service unavailable");
        }

        // ─── 8. PARSE RESPONSE ───────────────────────────────────────────────────
        let responseText = result.response.text().trim()
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        let botResponse = { text: "Tớ đang tải dữ liệu, bạn thử lại nhé!", type: "text", data: [] };

        try {
            const aiData = JSON.parse(responseText);
            const actionType      = aiData.action  || "chat";
            // ✅ FIX: phim/rap là null thật (không phải chuỗi "null")
            const phimDaNhanDien  = aiData.phim  && aiData.phim  !== "null" ? aiData.phim  : null;
            const rapDaNhanDien   = aiData.rap   && aiData.rap   !== "null" ? aiData.rap   : null;

            // ── HÀNH ĐỘNG: TÌM LỊCH CHIẾU ──────────────────────────────────────
            if (actionType === "schedule" && phimDaNhanDien) {
                const foundMovies = await Movie.find({
                    title: new RegExp(phimDaNhanDien, "i"),
                    status: "Đang chiếu",
                }).lean();

                if (foundMovies.length > 0) {
                    const query = { movie: foundMovies[0]._id };
                    if (rapDaNhanDien) {
                        // Tìm rạp theo tên (populate rồi filter)
                    }
                    const schedules = await Schedule.find(query)
                        .populate("movie", "title posterUrl image")
                        .populate("theater", "name city")
                        .sort({ startTime: 1 })
                        .limit(5)
                        .lean();

                    if (schedules.length > 0) {
                        const movie = foundMovies[0];
                        botResponse.type = "schedule";
                        botResponse.text = `🎬 Lịch chiếu phim **${foundMovies[0].title}**:`;
                        botResponse.data = schedules.map((s) => ({
                            _id: s._id,
                            movieTitle: s.movie?.title || foundMovies[0].title,
                            // ✅ Kèm ảnh phim
                            poster: movie.posterUrl || movie.image || "https://placehold.co/150x220?text=No+Poster",
                            theaterName: s.theater?.name || "?",
                            theaterCity: s.theater?.city || "",
                            startTime: s.startTime,
                            availableSeats: s.availableSeats ?? "?",
                        }));
                    } else {
                        botResponse.text = `Hiện chưa có lịch chiếu cho phim "${foundMovies[0].title}". Bạn thử kiểm tra lại sau nhé!`;
                    }
                } else {
                    botResponse.text = aiData.response || `Tớ không tìm thấy phim "${phimDaNhanDien}". Bạn thử tên khác nhé?`;
                }

                // ── HÀNH ĐỘNG: DANH SÁCH PHIM ───────────────────────────────────────
            } else if (actionType === "movie_list") {
                botResponse.type = "movie_list";
                botResponse.text = aiData.response || "🎬 Đây là các phim đang chiếu:";

                const movies = await Movie.find({ status: "Đang chiếu" })
                    .populate("genres", "name")
                    .limit(6)
                    .lean();

                // ✅ Kèm đầy đủ thông tin + ảnh
                botResponse.data = movies.map((m) => ({
                    _id: m._id,
                    title: m.title,
                    genre: m.genres?.length > 0 ? m.genres.map((g) => g.name).join(", ") : "Chưa cập nhật",
                    duration: m.duration ? `${m.duration} phút` : null,
                    rating: m.rating || null,
                    poster: m.posterUrl || m.image || "https://placehold.co/150x220?text=No+Poster",
                }));

                // ── HÀNH ĐỘNG: ĐỒ ĂN & NƯỚC ────────────────────────────────────────
            } else if (actionType === "product_list") {
                botResponse.type = "product_list";
                botResponse.text = aiData.response || "🍿 Đây là các món bắp và nước đang có:";

                const products = await Product.find().limit(8).lean();

                // ✅ Kèm ảnh sản phẩm
                botResponse.data = products.map((p) => ({
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    image: p.image || p.imageUrl || "https://placehold.co/150x150?text=🍿",
                    description: p.description || null,
                    category: p.category || null,
                }));

                // ── HÀNH ĐỘNG: CHAT THƯỜNG ──────────────────────────────────────────
            } else {
                botResponse.text = aiData.response || "Tớ hiểu rồi! Bạn cần tớ giúp gì thêm không?";
                botResponse.type = "text";
            }

        } catch (parseError) {
            console.warn("⚠️ JSON parse lỗi:", parseError.message);
            botResponse.text = responseText || "Xin lỗi, tớ chưa hiểu rõ câu hỏi. Bạn hỏi lại nhé!";
            botResponse.type = "text";
        }

        // ─── 9. LƯU DATABASE ─────────────────────────────────────────────────────
        try {
            await chatService.saveChatMessage(sessionId, userId, userName, "user", userMessage, "text", null);
            await chatService.saveChatMessage(sessionId, userId, userName, "bot", botResponse.text, botResponse.type, botResponse.data);
        } catch (saveError) {
            console.warn("⚠️ Không lưu được DB (vẫn trả response bình thường):", saveError.message);
        }

        // ─── 10. RETURN ──────────────────────────────────────────────────────────
        return res.json({ botMessage: botResponse, sessionId });

    } catch (error) {
        console.error("❌ CHAT ERROR:", error.constructor.name, "-", error.message);
        console.error(error.stack);

        if (error.message?.includes("429") || error.status === 429) {
            chatService.rotateKeyOnError();
            return res.json({
                botMessage: { text: "🔄 Hệ thống tự chuyển API. Bạn thử lại nhé!", type: "text", data: [] },
            });
        }

        const isDev = process.env.NODE_ENV === "development";
        return res.status(500).json({
            botMessage: {
                text: "Lỗi rồi fen ơi: " + (error.message || "Lỗi không xác định"),
                type: "text",
                data: [],
            },
            errorDetail: error.message
        });
    }
};

export default { handleChat };