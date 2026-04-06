import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const handleChat = async (req, res) => {
    // 🌟 VIP 1: Nhận thêm history (lịch sử) và tên user từ Frontend
    const { userMessage, history = [], userName = "Khách VIP" } = req.body;

    try {
        const [movies, theaters, schedules, products, vouchers] = await Promise.all([
            Movie.find().select('title genre description poster').limit(5),
            Theater.find().select('name address'),
            Schedule.find().populate('movie theater').select('startTime availableSeats').limit(10),
            Product.find().select('name price description'),
            Voucher.find({ isActive: true }).select('code discount description minSpend')
        ]);

        const context = `
          Bạn là trợ lý ảo CineBot của rạp phim CineBooking. 
          Người đang chat với bạn tên là: "${userName}". Hãy xưng "tớ" và gọi họ bằng tên hoặc "fen".
          
          Dữ liệu hiện tại:
          - Phim: ${JSON.stringify(movies)}
          - Rạp: ${JSON.stringify(theaters)}
          - Lịch: ${JSON.stringify(schedules)}
          - Bắp nước: ${JSON.stringify(products)}  
          - Khuyến mãi: ${JSON.stringify(vouchers)}
        
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

        const formattedHistory = history.map(msg => ({
            role: msg.role === 'bot' ? 'model' : 'user',
            parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
        }));

        const chatSession = model.startChat({
            history: [
                { role: "user", parts: [{ text: context }] },
                { role: "model", parts: [{ text: '{"text": "Đã nạp dữ liệu và luật lệ!", "type": "text", "data": []}' }] },
                ...formattedHistory // Nạp trí nhớ cũ vào đây
            ]
        });

        // Gửi tin nhắn hiện tại
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