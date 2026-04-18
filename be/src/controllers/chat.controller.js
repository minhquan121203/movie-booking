import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const handleChat = async (req, res) => {
    const { userMessage, history = [], userName = "Khách VIP" } = req.body;

    try {
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        // 1. LẤY DATA VÀ POPULATE ĐẦY ĐỦ (ĐẶC BIỆT LÀ THỂ LOẠI)
        const [movies, theaters, rawSchedules, products, vouchers] = await Promise.all([
            // 🔥 Thêm populate('genres') để lấy được chữ "Hành động", "Tình cảm"...
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
                description: "Hành động này được tự động gọi khi khách muốn biết CÒN GHẾ KHÔNG. Bạn PHẢI đọc cả câu nói hiện tại VÀ lịch sử chat để lấy dữ liệu.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tenPhim: {
                            type: "STRING",
                            description: "Tên phim. CỰC KỲ QUAN TRỌNG: Nếu câu nói hiện tại của khách KHÔNG CÓ tên phim, BẮT BUỘC phải đọc ngược lại lịch sử chat để tìm xem trước đó khách đang nói về phim nào."
                        },
                        tenRap: {
                            type: "STRING",
                            description: "Tên rạp. Tương tự, nếu câu hiện tại chỉ có tên phim, BẮT BUỘC tìm trong lịch sử chat xem khách có nhắc đến rạp nào không."
                        }
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

        const prompt = `
            Lịch sử trò chuyện đã được cung cấp đầy đủ trong bộ nhớ của bạn.
            Câu nói HIỆN TẠI của khách là: "${userMessage}"
            
            🚨 LỜI NHẮC ĐẶC BIỆT:
            Khách hàng thường nói chuyện ngắt quãng. (VD: Câu trước hỏi "Phim Cô Dâu", câu sau trả lời "Rạp Cầu Giấy"). 
            Nhiệm vụ của bạn là: TỰ LẮP GHÉP thông tin từ lịch sử. Nếu đã có đủ "Tên Phim" và "Tên Rạp" từ các câu thoại trước đó + hiện tại, BẮT BUỘC gọi ngay hàm "check_seat_details", KHÔNG ĐƯỢC CHAT NHẢM HỎI LẠI!
            
            Dựa vào Kho dữ liệu trên, hãy tư vấn cho khách.
            QUY TẮC BẮT BUỘC CHO KẾT QUẢ JSON:
            1. NẾU BẠN GIỚI THIỆU PHIM: BẮT BUỘC "type" PHẢI LÀ "movie_list", và "data.movieIds" chứa mảng các ID phim.
            2. NẾU KHÁCH MUỐN ĐẶT 1 PHIM CỤ THỂ: "type" là "action_booking", "data.movieId" là ID phim đó.
            3. CÒN LẠI CHỈ LÀ TRÒ CHUYỆN: "type" là "text".
            
            Format JSON TRẢ VỀ:
            {
                "text": "Câu trả lời thân thiện của bạn",
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
        res.status(500).json({ botMessage: { text: "Tớ đang đi mua bắp, fen đợi tí hỏi lại tớ nha!", type: "text", data: [] } });
    }
};

export default { handleChat };