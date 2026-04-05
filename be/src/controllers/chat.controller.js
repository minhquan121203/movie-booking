const { GoogleGenerativeAI } = require("@google/generative-ai");
const Movie = require("../models/Movie");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const handleChat = async (req, res) => {
    const { userMessage } = req.body;

    try {
        const movies = await Movie.find({ status: 'showing' }).select('title description');

        const context = `
      Bạn là trợ lý ảo tên CineBot của rạp phim CineBooking. 
      Hãy gọi khách là "bạn" và xưng là "mình".
      Dữ liệu phim đang chiếu tại rạp: ${JSON.stringify(movies)}.
      Dựa vào dữ liệu trên, hãy trả lời câu hỏi của khách. 
      Nếu khách hỏi phim không có trong danh sách, hãy lịch sự báo là rạp chưa có nhé.
    `;

        // 3. Gửi lệnh cho AI
        const prompt = `${context}\n\nKhách hàng hỏi: ${userMessage}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ botMessage: response.text() });
    } catch (error) {
        res.status(500).json({ botMessage: "AI đang bận đi mua bắp rang bơ rồi nhé!" });
    }
};