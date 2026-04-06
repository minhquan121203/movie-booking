import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const handleChat = async (req, res) => {
    const { userMessage } = req.body;

    try {
        const [movies, theaters, schedules] = await Promise.all([
            Movie.find({ status: 'showing' }).select('title genre description poster'), // Thêm poster để FE lấy ảnh
            Theater.find().select('name address'),
            Schedule.find().populate('movie theater').select('startTime availableSeats').limit(10)
        ]);

        const context = `
          Bạn là trợ lý ảo CineBot của rạp phim CineBooking. 
          Hãy gọi khách hàng là "fen" và xưng là "tớ".
          Dữ liệu hiện tại:
          - Phim: ${JSON.stringify(movies)}
          - Rạp: ${JSON.stringify(theaters)}
        
          YÊU CẦU ĐỊNH DẠNG TRẢ LỜI:
          Bạn PHẢI trả lời duy nhất dưới dạng một chuỗi JSON hợp lệ, không kèm thêm bất kỳ văn bản nào bên ngoài.
          Cấu trúc JSON như sau:
          {
            "text": "Câu chào hoặc câu dẫn dắt tự nhiên (ví dụ: 'Dưới đây là danh sách phim đang hot nè fen!')",
            "type": "text" hoặc "movie_list",
            "data": [] // Nếu type là movie_list, data sẽ là mảng các object phim: [{title, genre, poster, details_url}]
          }
        
          VÍ DỤ TRẢ LỜI (Nếu khách hỏi phim đang chiếu):
          {
            "text": "Nay rạp tớ có mấy siêu phẩm này đang chiếu nè, fen xem thử coi ưng cái nào không nhé!",
            "type": "movie_list",
            "data": [
              {
                "title": "Demon Slayer: Mugen Train",
                "genre": "Anime, Hành động",
                "poster": "link_ảnh_poster (nếu có trong dữ liệu, không thì để null)",
                "details_url": "/movies/id_phim" 
              }
            ]
          }
        `;

        const prompt = `${context}\n\nKhách hàng hỏi: ${userMessage}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();

        responseText = responseText.replace(/```json|```/g, "").trim();

        try {
            const botResponse = JSON.parse(responseText);
            res.json({ botMessage: botResponse });
        } catch (error) {
            console.error("Lỗi Parse JSON:", error);
            res.json({
                botMessage: {
                    text: responseText,
                    type: "text",
                    data: []
                }
            });
        }

    } catch (error) {
        console.error("Lỗi Server hoặc AI:", error);
        res.status(500).json({
            botMessage: {
                text: "Tớ đang bận xíu việc ở rạp, fen đợi tí hỏi lại tớ nha!",
                type: "text",
                data: []
            }
        });
    }
};

export default {
    handleChat
};