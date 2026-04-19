import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";

const apiKeys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()) : [];
let currentKeyIndex = 0; // Biến đánh dấu đang dùng Key số mấy

export const handleChat = async (req, res) => {
    const { userMessage, history = [], userName = "Khách VIP" } = req.body;

    try {
        // 🔥 GỌI AI BẰNG KEY HIỆN TẠI TRƯỚC KHI LÀM NHỮNG VIỆC KHÁC
        if (apiKeys.length === 0) {
            console.error("❌ Chưa cấu hình biến GEMINI_API_KEYS trong file .env");
            return res.status(500).json({ botMessage: { text: "Hệ thống đang bảo trì AI, fen quay lại sau nhé!", type: "text", data: [] } });
        }

        const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        // 1. LẤY DATA VÀ POPULATE ĐẦY ĐỦ (ĐẶC BIỆT LÀ THỂ LOẠI)
        const [movies, theaters, rawSchedules, products, vouchers] = await Promise.all([
            // Thêm populate('genres') để lấy được chữ "Hành động", "Tình cảm"...
            Movie.find({ status: "Đang chiếu" }).populate('genres', 'name'),
            Theater.find({ isActive: true }),
            Schedule.find()
                .populate('movie', 'title')
                .populate('theater', 'name')
                .sort({ startTime: 1 }),
            Product.find(),
            Voucher.find({ isActive: true })
        ]);

        // 2. ÉP DỮ LIỆU THÀNH VĂN BẢN ĐỂ AI DỄ ĐỌC (TIẾT KIỆM TOKEN)
        const moviesText = movies.map(m => {
            const genres = m.genres && m.genres.length > 0 ? m.genres.map(g => g.name).join(", ") : "Đang cập nhật";
            return `- [ID: ${m._id}] Phim: "${m.title}" | Thể loại: ${genres} | Thời lượng: ${m.duration} phút | Đánh giá: ${m.rating} | Nội dung: ${m.description}`;
        }).join("\n");

        const theatersText = theaters.map(t => `- Rạp: ${t.name} (Địa chỉ: ${t.address}, ${t.city})`).join("\n");

        const productsText = products.map(p => `- Bắp nước: ${p.name} | Giá: ${p.price} VNĐ`).join("\n");
        const vouchersText = vouchers.map(v => `- Mã KM: ${v.code} | Giảm giá: ${v.discount}% | Điều kiện: ${v.description}`).join("\n");

        const schedulesText = rawSchedules.filter(s => {
            const d = new Date(s.startTime);
            return s.movie && s.theater && d >= now && d <= next7Days;
        }).map(s => {
            const d = new Date(s.startTime);
            return `- Phim: ${s.movie.title} | Rạp: ${s.theater.name} | Thời gian: ${d.toLocaleTimeString('vi-VN')} ngày ${d.toLocaleDateString('vi-VN')} | Ghế trống: ${s.availableSeats}`;
        }).join("\n");

        // 3. XÂY DỰNG LUẬT CHƠI (SYSTEM PROMPT)
        const context = `
            Bạn là CineBot, một trợ lý ảo siêu thân thiện của rạp phim CineBooking. 
            Người đang chat tên là: "${userName}". Hãy xưng "tớ" và gọi họ bằng tên hoặc "fen".
            
            🎞️ [KHO DỮ LIỆU HIỆN TẠI TỚI 7 NGÀY TỚI]
            - PHIM ĐANG CHIẾU: 
            ${moviesText || "Không có phim nào"}
            
            - RẠP CHIẾU: 
            ${theatersText || "Không có rạp nào"}
            
            - LỊCH CHIẾU THỰC TẾ: 
            ${schedulesText || "Chưa có lịch chiếu"}
            
            - BẮP NƯỚC: 
            ${productsText || "Hết bắp nước"}
            
            - KHUYẾN MÃI: 
            ${vouchersText || "Không có khuyến mãi"}
            
            LƯU Ý TỐI QUAN TRỌNG:
            1. TUYỆT ĐỐI KHÔNG BỊA ĐẶT. Nếu khách hỏi thông tin không có trong danh sách trên, hãy xin lỗi.
            2. ĐỌC KỸ THỂ LOẠI PHIM: Để giới thiệu đúng thể loại khách tìm.
            3. Nếu khách hỏi "phim đó", hãy tự đọc lại tin nhắn trước để biết đang nói về phim nào.
            
            KỸ NĂNG TƯ VẤN THEO TÂM LÝ (QUAN TRỌNG):
            - Nếu khách than BUỒN / THẤT TÌNH / MỆT MỎI: Hãy an ủi nhẹ nhàng. Gợi ý 1-2 bộ phim thuộc thể loại Hài (Comedy), Hoạt hình (Animation) hoặc Tình cảm (Romance). Dựa vào "Nội dung" phim để nói lý do tại sao bộ phim này sẽ giúp họ vui lên.
            - Nếu khách than CHÁN / THIẾU MUỐI / BUỒN NGỦ: Hãy khuấy động không khí. Gợi ý phim Hành động (Action), Kinh dị (Horror), hoặc Viễn tưởng kịch tính để họ tỉnh ngủ.
            - Nếu khách muốn tìm PHIM HOT / PHIM HAY: Hãy ngẫu nhiên chọn ra 2 bộ phim nổi bật nhất (dựa vào tên phim hoặc nội dung hấp dẫn) để đề xuất.
            - KHI TƯ VẤN TÂM LÝ: LUÔN trả về type là "movie_list" hoặc "text" kèm theo lời động viên.
        `;

        // 4. LỊCH SỬ CHAT VÀ ÉP KIỂU JSON
        const safeHistory = Array.isArray(history) ? history : [];
        const validHistory = [];

        validHistory.push({ role: "user", parts: [{ text: context }] });
        validHistory.push({ role: "model", parts: [{ text: `{"text": "Đã rõ, tớ đã nạp toàn bộ thông tin phim, rạp, bắp nước và khuyến mãi!", "type": "text"}` }] });

        safeHistory.forEach(msg => {
            let plainText = typeof msg.content === 'string' ? msg.content : (msg.content?.text || JSON.stringify(msg.content));

            // Xử lý gộp các tin nhắn liên tiếp của cùng 1 role
            if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === (msg.role === 'bot' ? 'model' : 'user')) {
                validHistory[validHistory.length - 1].parts[0].text += "\n" + plainText;
            } else {
                validHistory.push({
                    role: msg.role === 'bot' ? 'model' : 'user',
                    parts: [{ text: plainText }]
                });
            }
        });

        const agentTools = [{
            functionDeclarations: [{
                name: "check_seat_details",
                description: "Kiểm tra số lượng ghế trống. BẮT BUỘC gọi hàm này khi bạn đã thu thập đủ Tên Phim và Tên Rạp từ cuộc trò chuyện.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tenPhim: { type: "STRING", description: "Tên phim. Phải tự động tìm trong lịch sử chat nếu câu hiện tại không có." },
                        tenRap: { type: "STRING", description: "Tên rạp. Phải tự động tìm trong lịch sử chat nếu câu hiện tại không có." }
                    },
                    required: ["tenPhim", "tenRap"]
                }
            }]
        }];

        // Ép AI luôn luôn trả về chuẩn JSON Schema
        const chatSession = model.startChat({
            history: validHistory,
            tools: agentTools,
        });

        const recentChats = safeHistory.slice(-4).map(msg => {
            let text = typeof msg.content === 'string' ? msg.content : (msg.content?.text || "");
            return `${msg.role === 'user' ? 'Khách' : 'Bot'}: ${text}`;
        }).join('\n');

        const prompt = `
            Câu nói HIỆN TẠI của khách: "${userMessage}"
            
            🚨 LỆNH TỐI CAO TỪ HỆ THỐNG:
            - Chú ý: Khách hàng thường chat ngắt quãng! (Ví dụ: Câu trước hỏi phim, câu này mới nhập tên rạp).
            - NHIỆM VỤ CỦA BẠN: Khám xét ngay lịch sử chat. Nếu câu trước khách vừa nhắc đến một bộ phim, và câu này khách nhập tên rạp -> BẠN ĐÃ CÓ ĐỦ 2 THAM SỐ.
            - NGHIÊM CẤM BẠN CHAT BẰNG CHỮ ĐỂ HỎI LẠI TÊN PHIM/TÊN RẠP NỮA! 
            - BẮT BUỘC PHẢI GỌI HÀM "check_seat_details" NGAY LẬP TỨC!

            QUY TẮC JSON (Chỉ dùng khi trò chuyện bình thường, KHÔNG dùng khi gọi hàm):
            1. GIỚI THIỆU PHIM: "type": "movie_list"
            2. ĐẶT PHIM: "type": "action_booking"
            3. TRÒ CHUYỆN: "type": "text"
            
            Format JSON TRẢ VỀ:
            {
                "text": "Câu trả lời của bạn",
                "type": "text", 
                "data": []
            }
        `;

        let result = await chatSession.sendMessage(prompt);
        const functionCall = result.response.functionCalls()?.[0];

        if (functionCall && functionCall.name === "check_seat_details") {
            const { tenPhim, tenRap } = functionCall.args;
            console.log(`\n==============================================`);
            console.log(`🤖 [AI AGENT KÍCH HOẠT] Đang tự động quét Database...`);
            console.log(`🔎 Mục tiêu: Phim [${tenPhim}] tại Rạp [${tenRap}]`);

            // AI tự động chọc vào mảng lịch chiếu để tìm dữ liệu Real-time
            const matchedSchedule = rawSchedules.find(s =>
                s.movie?.title?.toLowerCase().includes(tenPhim.toLowerCase()) &&
                s.theater?.name?.toLowerCase().includes(tenRap.toLowerCase())
            );

            let kqGhe = "Không tìm thấy suất chiếu nào phù hợp.";
            if (matchedSchedule) {
                const gheTrong = matchedSchedule.availableSeats;
                kqGhe = `Hệ thống vừa check Database: Phim ${matchedSchedule.movie.title} tại ${matchedSchedule.theater.name} hiện đang còn chính xác ${gheTrong} ghế trống. Hãy giục khách chốt vé ngay!`;
                console.log(`✅ [ĐÃ TÌM THẤY]: Còn ${gheTrong} ghế!`);
            } else {
                console.log(`❌ [KHÔNG TÌM THẤY SUẤT CHIẾU]`);
            }
            console.log(`==============================================\n`);

            result = await chatSession.sendMessage([{
                functionResponse: {
                    name: "check_seat_details",
                    response: { result: kqGhe }
                }
            }]);
        }

        let responseText = result.response.text();
        responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

        try {
            const botResponse = JSON.parse(responseText);

            // Xử lý móc ảnh Poster...
            if (botResponse.type === 'movie_list' && botResponse.data && Array.isArray(botResponse.data.movieIds)) {
                const listIds = botResponse.data.movieIds;
                const foundMovies = movies.filter(m => listIds.includes(m._id.toString()));

                botResponse.data = foundMovies.map(m => ({
                    _id: m._id,
                    title: m.title,
                    genre: m.genres && m.genres.length > 0 ? m.genres.map(g => g.name).join(", ") : "Đang chiếu",
                    poster: m.posterUrl || m.image || m.hinhAnh || m.thumbnail || "https://placehold.co/150x200?text=No+Poster"
                }));
            } else if (botResponse.type === 'text' || !botResponse.data) {
                botResponse.data = [];
            }

            res.json({ botMessage: botResponse });

        } catch (error) {
            // 🔥 NẾU LỖI PARSE JSON (TỨC LÀ AI NÓI CHỮ BÌNH THƯỜNG)
            console.log("⚠️ AI lười không trả JSON, tự động bọc lại text:", responseText);

            // Tự tạo object chuẩn gửi về cho Frontend
            res.json({
                botMessage: {
                    text: responseText, // Lấy nguyên câu nói của AI nhét vào đây
                    type: "text",
                    data: []
                }
            });
        }

    } catch (error) {
        console.error("Lỗi Server hoặc AI:", error);

        // LỖI 429: NẾU GOOGLE BÁO HẾT LƯỢT THÌ TỰ ĐỘNG ĐỔI KEY
        if (error.message && error.message.includes("429")) {
            console.log(`❌ Cảnh báo: Key số ${currentKeyIndex + 1} đã cạn kiệt!`);

            // Sang số: Tăng index lên 1. Nếu hết key thì quay vòng lại số 0.
            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

            console.log(`✅ Đã tự động sang số, chuyển sang Key số ${currentKeyIndex + 1}.`);

            return res.json({
                botMessage: {
                    text: "Hệ thống vừa đổi cụm máy chủ để tăng tốc độ. Fen vui lòng gửi lại tin nhắn vừa rồi giúp tớ nhé!",
                    type: "text",
                    data: []
                }
            });
        }

        // Các lỗi khác không phải 429 (mất mạng, code sai...)
        res.status(500).json({ botMessage: { text: "Tớ đang đi mua bắp, fen đợi tí hỏi lại tớ nha!", type: "text", data: [] } });
    }
};

export default { handleChat };