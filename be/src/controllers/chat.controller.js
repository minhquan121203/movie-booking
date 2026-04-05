import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Schedule from "../models/schedule.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const handleChat = async (req, res) => {
    const { userMessage } = req.body;

    try {
        // 1. Lấy dữ liệu thực tế từ Database của fen
        const [movies, theaters, schedules] = await Promise.all([
            Movie.find({ status: 'showing' }).select('title genre description'),
            Theater.find().select('name address'),
            Schedule.find().populate('movie theater').select('startTime availableSeats').limit(10)
        ]);

        // 2. Tạo "Ngữ cảnh" (Context)
        const context = `
      Bạn là trợ lý ảo CineBot của rạp phim CineBooking. 
      Hãy gọi khách hàng là "fen" và xưng là "tớ".
      Dữ liệu hiện tại:
      - Phim: ${JSON.stringify(movies)}
      - Rạp: ${JSON.stringify(theaters)}
      - Lịch chiếu: ${JSON.stringify(schedules)}

      Hãy dựa vào dữ liệu trên để tư vấn về thể loại, địa chỉ rạp và giờ chiếu. 
      Nếu không có thông tin, hãy xin lỗi lịch sự.
    `;

        // 3. Gửi cho Gemini
        const prompt = `${context}\n\nKhách hàng hỏi: ${userMessage}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ botMessage: response.text() });
    } catch (error) {
        console.error("Lỗi Chatbot:", error);
        res.status(500).json({ botMessage: "AI đang bận đi mua bắp rang bơ rồi fen!" });
    }
};

export default handleChat;