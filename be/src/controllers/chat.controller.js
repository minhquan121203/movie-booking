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

        const [movies, theaters, rawSchedules, products, vouchers] = await Promise.all([
            Movie.find().select('title genre description poster image hinhAnh thumbnail'),
            Theater.find().select('name address'),
            Schedule.find()
                .populate('movie', 'title')
                .populate('theater', 'name')
                .select('startTime availableSeats')
                .sort({ startTime: 1 }),
            Product.find().select('name price description'),
            Voucher.find({ isActive: true }).select('code discount description minSpend')
        ]);

        console.log("=== TỔNG LỊCH (ĐÃ THÁO CHỐT) ===", rawSchedules.length);
        const schedules = rawSchedules.map(s => {
            if (!s.movie || !s.theater || !s.startTime) return null;

            const d = new Date(s.startTime);

            if (d < now || d > next7Days) return null;

            const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = d.toLocaleDateString('vi-VN');

            return {
                id: s.movie._id, // Ép lấy ID phim
                title: s.movie.title, // Ép lấy tên phim
                genre: s.movie.genre || "Đang hot",
                poster: s.movie.poster || s.movie.image || s.movie.hinhAnh || s.movie.thumbnail, // Ép lấy link ảnh
                rap: s.theater.name,
                thoiGian: `${timeStr} ngày ${dateStr}`,
                gheTrong: s.availableSeats
            };
        }).filter(item => item !== null);

        const context = `
          Bạn là trợ lý ảo CineBot của rạp phim CineBooking. 
          Người đang chat với bạn tên là: "${userName}". Hãy xưng "tớ" và gọi họ bằng tên hoặc "fen".
          
          Dữ liệu hiện tại:
          - Phim: ${JSON.stringify(movies)}
          - Rạp: ${JSON.stringify(theaters)}
          - Lịch: ${JSON.stringify(schedules)}
          - Bắp nước: ${JSON.stringify(products)}  
          - Khuyến mãi: ${JSON.stringify(vouchers)}
        
          LƯU Ý TỐI QUAN TRỌNG (CẤM VI PHẠM):
          1. TUYỆT ĐỐI KHÔNG bịa đặt thông tin, KHÔNG tự chế tên phim, KHÔNG tự chế lịch chiếu.
          2. CHỈ TƯ VẤN lịch chiếu CÓ THẬT trong mảng "Lịch" ở trên.
          3. Nếu khách hỏi rạp X mà trong dữ liệu "Lịch" không có suất chiếu nào của rạp X, bạn PHẢI trả lời: "Hiện tại tớ chưa có thông tin lịch chiếu của rạp này trong thời gian tới fen ạ!".
        
          YÊU CẦU ĐỊNH DẠNG TRẢ LỜI (BẮT BUỘC):
          Bạn PHẢI trả lời dưới dạng JSON hợp lệ, không có markdown.
          Các "type" được phép:
          1. "text": Trò chuyện bình thường, tư vấn bắp nước, khuyến mãi.
          2. "movie_list": Liệt kê danh sách phim.
          3. "action_booking": (QUAN TRỌNG) Dùng khi khách CÓ Ý ĐỊNH MUA VÉ/ĐẶT VÉ một phim cụ thể.

          VÍ DỤ TRẢ LỜI - KHÁCH MUỐN ĐẶT VÉ (VIP 2):
          Khách: "Cho tớ 1 vé Đào Phở Piano nhé" hoặc "Tớ muốn mua vé phim này".
          {
            "text": "Ok fen, tớ mở trang chọn ghế phim Đào, Phở và Piano cho fen luôn nè!",
            "type": "action_booking",
            "data": { "movieId": "_id_của_phim_trong_database" }
          }
        `;

        const safeHistory = Array.isArray(history) ? history : [];
        const formattedHistory = safeHistory.map(msg => {
            let plainText = "";
            // Chỉ trích xuất phần text thuần túy để AI dễ ghi nhớ
            if (typeof msg.content === 'string') {
                plainText = msg.content;
            } else if (msg.content && msg.content.text) {
                plainText = msg.content.text;
            } else {
                plainText = JSON.stringify(msg.content);
            }

            return {
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: plainText }]
            };
        });

        const rawHistory = [
            { role: "user", parts: [{ text: context + "\n\nLƯU Ý QUAN TRỌNG: Nếu khách nói 'phim đó', 'phim ý', hãy tự động đọc lại tin nhắn trước đó để biết chính xác là phim nào và lấy đúng _id của phim đó để đặt vé!" }] },
            { role: "model", parts: [{ text: 'Đã rõ! Tớ đã ghi nhớ toàn bộ luật và lịch sử trò chuyện.' }] },
            ...formattedHistory
        ];

        const validHistory = [];
        for (const msg of rawHistory) {
            if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === msg.role) {
                validHistory[validHistory.length - 1].parts[0].text += "\n" + msg.parts[0].text;
            } else {
                validHistory.push(msg);
            }
        }

        const chatSession = model.startChat({
            history: validHistory
        });

        const result = await chatSession.sendMessage(userMessage);
        let responseText = result.response.text();

        responseText = responseText.replace(/```json|```/g, "").trim();

        try {
            const botResponse = JSON.parse(responseText);
            res.json({ botMessage: botResponse });
        } catch (error) {
            console.error("Lỗi Parse JSON:", error);
            res.json({
                botMessage: { text: responseText, type: "text", data: [] }
            });
        }

    } catch (error) {
        console.error("Lỗi Server hoặc AI:", error);
        res.status(500).json({
            botMessage: { text: "Tớ đang bận xíu việc ở rạp, fen đợi tí hỏi lại tớ nha!", type: "text", data: [] }
        });
    }
};

export default { handleChat };