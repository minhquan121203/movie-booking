import { api } from './axios';

// Lấy thông tin điểm và hạng hiện tại
export const getLoyaltyMe = async () => {
    const res = await api.get('/loyalty/me');
    return res.data;
};

// Lấy lịch sử tích/tiêu điểm
export const getLoyaltyHistory = async () => {
    const res = await api.get('/loyalty/history');
    return res.data;
};

// Gọi API xem trước số tiền được giảm
export const previewPointDiscount = async (pointsToUse: number, subtotal: number) => {
    const res = await api.post('/loyalty/preview', { pointsToUse, subtotal });
    return res.data;
    // Trả về dạng: { discountAmount: 50000, finalTotal: 150000, ... }
};