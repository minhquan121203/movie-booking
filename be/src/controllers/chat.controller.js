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
            Người đang chat tên là: "${userName}". Hãy xưng "tớ" và gọi khách là "bạn" hoặc gọi thân thiện bằng tên "${userName}". 
            TUYỆT ĐỐI KHÔNG xưng hô là "fen".
            
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

        // Ép AI luôn luôn trả về chuẩn JSON Schema
        const chatSession = model.startChat({
            history: validHistory
        });

        const recentChats = safeHistory.slice(-4).map(msg => {
            let text = typeof msg.content === 'string' ? msg.content : (msg.content?.text || "");
            return `${msg.role === 'user' ? 'Khách' : 'Bot'}: ${text}`;
        }).join('\n');

        const prompt = `
            Bạn là NLU phân tích ngôn ngữ.
            [LỊCH SỬ CHAT]
            ${recentChats || "Không có lịch sử"}
            
            [CÂU HIỆN TẠI]
            "${userMessage}"
            
            🚨 QUY TẮC SINH TỬ:
            Nếu câu hiện tại khách nói "phim đó", "phim này", "rạp đó"... BẠN PHẢI nhìn lên [LỊCH SỬ CHAT] xem câu trước đó bot hoặc khách vừa nhắc đến tên phim/rạp là gì, và điền tên thật đó vào JSON.
            
            👇 TRẢ VỀ DUY NHẤT 1 KHỐI JSON, KHÔNG BỌC MARKDOWN, BẮT CHƯỚC Y HỆT VÍ DỤ NÀY:
            {
                "suy_luan": "Khách nói 'phim đó', câu trước nhắc phim Cô Dâu. Vậy Tên phim là Cô Dâu.",
                "nhan_dien_phim": "Tên phim thật (VD: Cô Dâu). KHÔNG ĐƯỢC ghi chữ 'phim đó'",
                "nhan_dien_rap": "Tên rạp thật (VD: Lotte). KHÔNG ĐƯỢC ghi chữ 'rạp đó'",
                "phan_loai_hanh_dong": "tim_lich_chieu",
                "cau_tra_loi": ""
            }
        `;

        let result = await chatSession.sendMessage(prompt);
        let responseText = result.response.text();

        // 🔪 Lột vỏ Markdown tàn nhẫn
        responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

        let botResponse = { text: "", type: "text", data: [] };

        try {
            const aiData = JSON.parse(responseText);
            console.log("🗣️ [AI SUY LUẬN]:", aiData.suy_luan);

            let phimDaNhanDien = aiData.nhan_dien_phim;
            let rapDaNhanDien = aiData.nhan_dien_rap;

            // 🔥 BƯỚC 2: CỨU BÀN BẰNG REGEX (Không thèm dùng DB nữa)
            if (!phimDaNhanDien || phimDaNhanDien.toLowerCase().includes("phim") || phimDaNhanDien === "null") {
                // Quét thẳng vào lịch sử chat xem có chữ nào nằm trong ngoặc kép sau chữ "phim" không
                const matchPhim = recentChats.match(/phim ["']?([^"']+)["']?/i);
                if (matchPhim && matchPhim[1] && !matchPhim[1].includes("đó") && !matchPhim[1].includes("này")) {
                    phimDaNhanDien = matchPhim[1].trim();
                    console.log(`⚡ [REGEX NODE.JS] Móc họng lịch sử lấy được phim: [${phimDaNhanDien}]`);
                } else {
                    phimDaNhanDien = null;
                }
            }
            aiData.nhan_dien_phim = phimDaNhanDien;

            // Làm tương tự với rạp
            if (!rapDaNhanDien || rapDaNhanDien.toLowerCase().includes("rạp") || rapDaNhanDien === "null") {
                const matchRap = recentChats.match(/rạp ([a-zA-Z0-9\s]+)(?:\.|,|\?|$)/i);
                if (matchRap && matchRap[1] && !matchRap[1].includes("đó") && !matchRap[1].includes("nào")) {
                    rapDaNhanDien = matchRap[1].replace(/không|có/gi, "").trim();
                    console.log(`⚡ [REGEX NODE.JS] Móc họng lịch sử lấy được rạp: [${rapDaNhanDien}]`);
                } else {
                    rapDaNhanDien = null;
                }
            }
            aiData.nhan_dien_rap = rapDaNhanDien;

            console.log("🧠 [CHỐT HẠ ĐỂ QUÉT DB]:", aiData.nhan_dien_phim, "|", aiData.nhan_dien_rap);

            let hanhDong = aiData.phan_loai_hanh_dong;
            if ((aiData.nhan_dien_phim || aiData.nhan_dien_rap) && (hanhDong === "goi_y_phim" || hanhDong === "tro_chuyen")) {
                hanhDong = "tim_lich_chieu";
            }

            // 🚀 BƯỚC 2: LOGIC QUÉT DATABASE
            if (hanhDong === "tim_lich_chieu" || hanhDong === "tim_ghe") {

                // TRƯỜNG HỢP 1: CÓ CẢ PHIM VÀ RẠP
                if (aiData.nhan_dien_phim && aiData.nhan_dien_rap) {
                    console.log(`🤖 [NODE.JS] Quét: Phim [${aiData.nhan_dien_phim}] tại Rạp [${aiData.nhan_dien_rap}]`);
                    const matchedSchedule = rawSchedules.find(s =>
                        s.movie?.title?.toLowerCase().includes(aiData.nhan_dien_phim.toLowerCase()) &&
                        s.theater?.name?.toLowerCase().includes(aiData.nhan_dien_rap.toLowerCase())
                    );

                    if (matchedSchedule) {
                        botResponse.text = `Tuyệt vời! Phim **${matchedSchedule.movie.title}** tại rạp **${matchedSchedule.theater.name}** đang còn **${matchedSchedule.availableSeats} ghế trống**. Fen chốt luôn không tớ đặt cho!`;
                    } else {
                        botResponse.text = `Fen ơi tớ check kỹ rồi, phim "${aiData.nhan_dien_phim}" không có suất chiếu nào ở rạp "${aiData.nhan_dien_rap}" cả. Fen đổi rạp khác nha?`;
                    }
                }
                // TRƯỜNG HỢP 2: CÓ PHIM NHƯNG KHÔNG CÓ RẠP
                else if (aiData.nhan_dien_phim && !aiData.nhan_dien_rap) {
                    const cacRapDangChieu = rawSchedules
                        .filter(s => s.movie?.title?.toLowerCase().includes(aiData.nhan_dien_phim.toLowerCase()))
                        .map(s => s.theater?.name);
                    const danhSachRap = [...new Set(cacRapDangChieu)];

                    if (danhSachRap.length > 0) {
                        botResponse.text = `Tớ thấy phim **${aiData.nhan_dien_phim}** đang chiếu tại: **${danhSachRap.join(", ")}**. Fen tiện đi rạp nào nhất?`;
                    } else {
                        botResponse.text = `Hiện tại phim "${aiData.nhan_dien_phim}" tớ không thấy rạp nào chiếu cả fen ạ.`;
                    }
                }
                // TRƯỜNG HỢP 3: CÓ RẠP NHƯNG KHÔNG CÓ PHIM
                else if (!aiData.nhan_dien_phim && aiData.nhan_dien_rap) {
                    botResponse.text = `Tớ ghi nhận rạp **${aiData.nhan_dien_rap}** rồi. Nhưng fen muốn check ghế phim nào ở rạp này nhỉ?`;
                }
                // TRƯỜNG HỢP 4: THIẾU CẢ 2
                else {
                    botResponse.text = aiData.cau_tra_loi;
                }
                botResponse.type = "text";
            }

            // XỬ LÝ CÁC HÀNH ĐỘNG KHÁC (GỢI Ý PHIM, ĐẶT VÉ...)
            else if (hanhDong === "goi_y_phim" || hanhDong === "dat_ve") {
                botResponse.text = aiData.cau_tra_loi;
                botResponse.type = hanhDong === "goi_y_phim" ? "movie_list" : "action_booking";

                if (aiData.danh_sach_id_phim && Array.isArray(aiData.danh_sach_id_phim)) {
                    const foundMovies = movies.filter(m => aiData.danh_sach_id_phim.includes(m._id.toString()));
                    botResponse.data = foundMovies.map(m => ({
                        _id: m._id,
                        title: m.title,
                        genre: m.genres && m.genres.length > 0 ? m.genres.map(g => g.name).join(", ") : "Đang chiếu",
                        poster: m.posterUrl || m.image || m.hinhAnh || m.thumbnail || "https://placehold.co/150x200?text=No+Poster"
                    }));
                }
            }
            else {
                botResponse.text = aiData.cau_tra_loi;
                botResponse.type = "text";
            }

            // 🔥 BỨC TƯỜNG CHỐNG MÓM (NẾU AI TRẢ VỀ TEXT RỖNG)
            if (!botResponse.text || botResponse.text.trim() === "") {
                botResponse.text = "Hệ thống đang tải dữ liệu hơi chậm xíu, fen nói lại giúp tớ nha!";
                botResponse.type = "text";
            }

            res.json({ botMessage: botResponse });

        } catch (error) {
            // NẾU LỖI PARSE JSON
            console.log("⚠️ AI lười không trả JSON, tự động bọc lại text:", responseText);
            res.json({
                botMessage: {
                    text: responseText,
                    type: "text",
                    data: []
                }
            });
        }

    } catch (error) { // CÁI CATCH NÀY DÀNH CHO LỖI TỔNG (Như mạng mẽo, 429...)
        console.error("Lỗi Server hoặc AI:", error);

        // LỖI 429: ĐỔI KEY
        if (error.message && error.message.includes("429")) {
            console.log(`❌ Cảnh báo: Key số ${currentKeyIndex + 1} đã cạn kiệt!`);
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

        res.status(500).json({ botMessage: { text: "Tớ đang đi mua bắp, fen đợi tí hỏi lại tớ nha!", type: "text", data: [] } });
    }
};

export default { handleChat };