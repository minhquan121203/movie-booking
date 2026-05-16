'use client'

import { useEffect, useState } from 'react';
import { Star, TrendingUp, TrendingDown, Clock, Award } from 'lucide-react';
import { getLoyaltyHistory } from '@/lib/api/loyalty'; // Đảm bảo fen đã có hàm này trong api
import { useUserStore } from '@/store/userStore';

export function LoyaltyTab() {
    const { user } = useUserStore();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getLoyaltyHistory();
                // Tùy theo cấu trúc API backend trả về, thường là res.data hoặc res.data.transactions
                setHistory(res.data?.transactions || res.data || []);
            } catch (error) {
                console.error("Lỗi lấy lịch sử điểm:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* THẺ THÀNH VIÊN (Card VIP) */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                {/* Họa tiết mờ ảo cho đẹp */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-amber-100 font-medium mb-1">Thẻ Thành Viên</p>
                        <h2 className="text-2xl font-bold uppercase tracking-wider">{user?.fullName}</h2>
                    </div>
                    <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-sm border border-white/30">
                        <Award className="w-5 h-5 text-amber-100" />
                        <span className="font-bold text-white uppercase">{user?.membershipLevel || 'Bạc'}</span>
                    </div>
                </div>

                <div className="mt-8 flex items-end justify-between relative z-10">
                    <div>
                        <p className="text-amber-100 text-sm mb-1">Điểm khả dụng</p>
                        <div className="text-4xl font-black flex items-center gap-2 drop-shadow-md">
                            {user?.loyaltyPoints?.toLocaleString('vi-VN') || 0}
                            <Star className="w-7 h-7 fill-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* BẢNG LỊCH SỬ GIAO DỊCH */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-text-secondary" /> Lịch sử giao dịch điểm
                </h3>

                {loading ? (
                    <div className="text-center py-8 text-text-secondary font-medium animate-pulse">Đang tải dữ liệu...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-10 text-text-secondary bg-bg-secondary rounded-xl border border-dashed border-border font-medium">
                        Bạn chưa có giao dịch điểm nào.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, idx) => {
                            const isEarn = item.type === 'earn'; // 'earn' = cộng điểm, 'redeem' = trừ điểm
                            return (
                                <div key={idx} className="flex justify-between items-center p-4 hover:bg-bg-secondary rounded-xl border border-border transition-all hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-full ${isEarn ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                            {isEarn ? <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary line-clamp-1">{item.description}</p>
                                            <p className="text-xs text-text-secondary mt-1 font-medium">
                                                {new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`font-black text-xl whitespace-nowrap ${isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {isEarn ? '+' : '-'}{Math.abs(item.points).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}