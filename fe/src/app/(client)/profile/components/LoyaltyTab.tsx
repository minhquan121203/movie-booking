'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp, TrendingDown, Clock, Award, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getLoyaltyHistory, getLoyaltyMe } from '@/lib/api/loyalty'
import { useUserStore } from '@/store/userStore'

const ITEMS_PER_PAGE = 5

interface LoyaltyData {
    points: number
    totalEarned: number
    level: string
    earnRate: number
    redeemRate: number
    nextLevel: string | null
    pointsToNextLevel: number
    progress: number
    stats: {
        totalEarned: number
        totalRedeemed: number
        totalRefunded: number
        totalBonus: number
        transactionCount: number
    }
}

export function LoyaltyTab() {
    const { user, fetchUser } = useUserStore()
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
    const [loyaltyLoading, setLoyaltyLoading] = useState(true)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Lấy dữ liệu loyalty realtime từ server (không dùng cache)
    const fetchLoyalty = async () => {
        setLoyaltyLoading(true)
        try {
            const res = await getLoyaltyMe()
            setLoyaltyData(res.data)
        } catch (error) {
            console.error('Lỗi lấy loyalty:', error)
        } finally {
            setLoyaltyLoading(false)
        }
    }

    const fetchHistory = async (page: number) => {
        setLoading(true)
        try {
            const res = await getLoyaltyHistory(page, ITEMS_PER_PAGE)
            setHistory(res.data?.transactions || res.data || [])
            const pagination = res.data?.pagination
            if (pagination) {
                setTotalPages(pagination.totalPages || 1)
                setTotalItems(pagination.totalItems || 0)
            }
        } catch (error) {
            console.error('Lỗi lấy lịch sử điểm:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch dữ liệu loyalty realtime + cập nhật userStore
    useEffect(() => {
        fetchLoyalty()
        fetchUser()
    }, [])

    useEffect(() => {
        fetchHistory(currentPage)
    }, [currentPage])

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // Bảng màu theo hạng thành viên
    const currentLevel = loyaltyData?.level || user?.membershipLevel || 'Bạc'
    const tierTheme = {
        'Bạc': {
            card: 'from-slate-600 via-slate-500 to-zinc-600',
            badge: 'bg-white/15 border-white/25',
            label: 'text-slate-200',
            subtext: 'text-slate-300/70',
            starFill: 'fill-slate-300 text-slate-300',
            starAccent: 'fill-white',
            progressBg: 'bg-white/15',
            progressBar: 'from-slate-300 to-white',
            glow1: 'bg-slate-300',
            glow2: 'bg-white',
        },
        'Vàng': {
            card: 'from-yellow-900 via-amber-800 to-stone-800',
            badge: 'bg-yellow-400/15 border-yellow-300/25',
            label: 'text-amber-200',
            subtext: 'text-amber-300/50',
            starFill: 'fill-yellow-400 text-yellow-400',
            starAccent: 'fill-amber-200',
            progressBg: 'bg-yellow-950/50',
            progressBar: 'from-yellow-400 to-amber-200',
            glow1: 'bg-yellow-400',
            glow2: 'bg-amber-300',
        },
        'Kim Cương': {
            card: 'from-indigo-700 via-violet-600 to-purple-700',
            badge: 'bg-violet-300/20 border-violet-200/30',
            label: 'text-violet-200',
            subtext: 'text-violet-300/60',
            starFill: 'fill-violet-300 text-violet-300',
            starAccent: 'fill-white',
            progressBg: 'bg-violet-900/40',
            progressBar: 'from-violet-300 to-pink-200',
            glow1: 'bg-violet-400',
            glow2: 'bg-pink-300',
        },
    }
    const t = tierTheme[currentLevel as keyof typeof tierTheme] || tierTheme['Bạc']

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* THẺ THÀNH VIÊN — Premium design */}
            <div className={`bg-gradient-to-br ${t.card} rounded-2xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden`}>
                {/* Decorative glows */}
                <div className={`absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full ${t.glow1} opacity-[0.08] blur-3xl`}></div>
                <div className={`absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full ${t.glow2} opacity-[0.06] blur-2xl`}></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-60"></div>

                {/* Top: Name + Badge */}
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className={`${t.label} text-xs font-semibold tracking-widest uppercase mb-1.5`}>Thẻ Thành Viên</p>
                        <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide drop-shadow-sm">{user?.fullName}</h2>
                    </div>
                    <div className={`${t.badge} px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md border shadow-lg`}>
                        <Award className="w-4 h-4" />
                        <span className="font-bold text-sm uppercase tracking-wider">
                            {loyaltyLoading ? '...' : currentLevel}
                        </span>
                    </div>
                </div>

                {loyaltyLoading ? (
                    <div className="mt-8 flex items-center gap-3 relative z-10">
                        <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                        <span className="text-sm font-medium text-white/50">Đang tải...</span>
                    </div>
                ) : (
                    <div className="mt-6 md:mt-8 relative z-10">
                        {/* 2 cột: Tổng đã tích + Điểm khả dụng */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className={`${t.label} text-[11px] font-semibold uppercase tracking-wider`}>Tổng điểm đã tích</p>
                                <div className="text-3xl md:text-4xl font-black flex items-baseline gap-1.5 tabular-nums">
                                    {(loyaltyData?.totalEarned ?? 0).toLocaleString('vi-VN')}
                                    <Star className={`w-5 h-5 ${t.starFill} mb-0.5`} />
                                </div>
                                <p className={`text-[10px] ${t.subtext} font-medium`}>Dùng để xét nâng hạng</p>
                            </div>
                            <div className="space-y-1">
                                <p className={`${t.label} text-[11px] font-semibold uppercase tracking-wider`}>Điểm khả dụng</p>
                                <div className="text-3xl md:text-4xl font-black flex items-baseline gap-1.5 tabular-nums">
                                    {(loyaltyData?.points ?? user?.loyaltyPoints ?? 0).toLocaleString('vi-VN')}
                                    <Star className={`w-5 h-5 ${t.starAccent} mb-0.5`} />
                                </div>
                                <p className={`text-[10px] ${t.subtext} font-medium`}>Có thể đổi giảm giá</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mt-5 mb-4 border-t border-white/10"></div>

                        {/* Progress bar tới hạng tiếp theo */}
                        {loyaltyData?.nextLevel && (
                            <div>
                                <div className="flex justify-between text-[11px] mb-2">
                                    <span className={`${t.label} font-semibold`}>Tiến trình lên hạng <span className="font-extrabold">{loyaltyData.nextLevel}</span></span>
                                    <span className="font-black text-white">{loyaltyData.progress}%</span>
                                </div>
                                <div className={`w-full h-2 ${t.progressBg} rounded-full overflow-hidden`}>
                                    <div
                                        className={`h-full bg-gradient-to-r ${t.progressBar} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                        style={{ width: `${loyaltyData.progress}%` }}
                                    />
                                </div>
                                <p className={`text-[11px] ${t.label} mt-2 font-medium opacity-80`}>
                                    Cần tích thêm <span className="font-extrabold text-white">{loyaltyData.pointsToNextLevel.toLocaleString('vi-VN')}</span> điểm nữa
                                </p>
                            </div>
                        )}

                        {!loyaltyData?.nextLevel && (
                            <p className={`text-xs ${t.label} font-semibold`}>✨ Bạn đã đạt hạng cao nhất!</p>
                        )}
                    </div>
                )}
            </div>

            {/* BẢNG LỊCH SỬ GIAO DỊCH */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Clock className="w-5 h-5 text-text-secondary" /> Lịch sử giao dịch điểm
                    </h3>
                    {totalItems > 0 && (
                        <span className="text-xs text-text-secondary font-medium bg-bg-secondary px-3 py-1 rounded-full">
                            {totalItems} giao dịch
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-border animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-muted/30"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-48 bg-muted/30 rounded"></div>
                                        <div className="h-3 w-28 bg-muted/20 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-5 w-12 bg-muted/30 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-10 text-text-secondary bg-bg-secondary rounded-xl border border-dashed border-border font-medium">
                        Bạn chưa có giao dịch điểm nào.
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {history.map((item, idx) => {
                                const isEarn = item.type === 'earn'
                                return (
                                    <div key={item._id || idx} className="flex justify-between items-center p-4 hover:bg-bg-secondary rounded-xl border border-border transition-all hover:shadow-md">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2.5 rounded-full shrink-0 ${isEarn ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                                {isEarn
                                                    ? <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-text-primary line-clamp-1 text-sm">{item.description}</p>
                                                <p className="text-xs text-text-secondary mt-1 font-medium">
                                                    {new Date(item.createdAt).toLocaleString('vi-VN', {
                                                        hour: '2-digit', minute: '2-digit',
                                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`font-black text-lg whitespace-nowrap ml-4 ${isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {isEarn ? '+' : '-'}{Math.abs(item.points).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="p-2 rounded-lg border border-border hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-text-secondary" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        // Show: first, last, current ± 1
                                        if (page === 1 || page === totalPages) return true
                                        if (Math.abs(page - currentPage) <= 1) return true
                                        return false
                                    })
                                    .reduce<(number | 'ellipsis')[]>((acc, page, i, arr) => {
                                        if (i > 0 && page - (arr[i - 1] as number) > 1) {
                                            acc.push('ellipsis')
                                        }
                                        acc.push(page)
                                        return acc
                                    }, [])
                                    .map((item, i) =>
                                        item === 'ellipsis' ? (
                                            <span key={`e-${i}`} className="px-1 text-text-secondary">…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => goToPage(item as number)}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === item
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'border border-border text-text-secondary hover:bg-bg-secondary'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )
                                }

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="p-2 rounded-lg border border-border hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}