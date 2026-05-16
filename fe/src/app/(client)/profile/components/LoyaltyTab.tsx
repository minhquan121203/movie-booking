'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp, TrendingDown, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLoyaltyHistory } from '@/lib/api/loyalty'
import { useUserStore } from '@/store/userStore'

const ITEMS_PER_PAGE = 5

export function LoyaltyTab() {
    const { user, fetchUser } = useUserStore()
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

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

    // Fetch lại user mới nhất từ server khi mở tab (tránh hiện số điểm cũ từ cache)
    useEffect(() => {
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* THẺ THÀNH VIÊN */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
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
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                                    currentPage === item
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