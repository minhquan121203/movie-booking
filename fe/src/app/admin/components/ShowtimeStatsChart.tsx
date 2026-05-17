'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Check, ChevronDown, Search, Film, CalendarX2 } from 'lucide-react'
import { api } from '@/lib/api/axios'
import { cn } from '@/lib/utils'

export function ShowtimeStatsChart() {
    const [movies, setMovies] = useState<any[]>([])
    const [selectedMovieId, setSelectedMovieId] = useState<string>('')

    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState<string>(today)

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const res = await api.get('/movies?limit=1000&sortBy=createdAt&order=desc')
                if (res.data?.data?.movies) {
                    setMovies(res.data.data.movies)
                    if (res.data.data.movies.length > 0) {
                        setSelectedMovieId(res.data.data.movies[0]._id)
                    }
                }
            } catch (error) {
                console.error('Lỗi lấy danh sách phim:', error)
            }
        }
        fetchMovies()
    }, [])

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedMovieId) return
            setLoading(true)
            try {
                const res = await api.get(`/admin/statistics/movies/${selectedMovieId}/showtimes?date=${selectedDate}`)
                if (res.data?.data) {
                    setData(res.data.data)
                }
            } catch (error) {
                console.error('Lỗi lấy dữ liệu thống kê:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [selectedMovieId, selectedDate])

    const filteredMovies = movies.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedMovie = movies.find(m => m._id === selectedMovieId)

    return (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full w-full overflow-hidden">

            {/* HEADER FIX: Dùng flex-col hoàn toàn để không bao giờ bị tràn viền */}
            <div className="flex flex-col mb-6 gap-4">

                <div className="w-full">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl shrink-0">
                            <Film className="w-5 h-5" />
                        </span>
                        <span>Khung Giờ Bán Chạy Nhất</span>
                    </h3>
                </div>

                {/* BỘ LỌC FIX: Wrap tự động rớt dòng, ép không cho tràn */}
                <div className="flex flex-wrap gap-3 w-full">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:flex-1 min-w-[140px] px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-slate-700 dark:text-slate-200"
                    />

                    <div className="relative w-full sm:flex-[2] min-w-[180px]" ref={dropdownRef}>
                        <div
                            className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 pr-2">
                                {selectedMovie ? selectedMovie.title : 'Chọn phim...'}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                        </div>

                        {isOpen && (
                            <div className="absolute left-0 z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Nhập tên phim..."
                                            autoFocus
                                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>

                                <div className="max-h-[250px] overflow-y-auto p-2 custom-scrollbar">
                                    {filteredMovies.length > 0 ? (
                                        filteredMovies.map((m) => (
                                            <div
                                                key={m._id}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-3 text-sm rounded-xl cursor-pointer transition-colors mb-1 last:mb-0",
                                                    selectedMovieId === m._id
                                                        ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold"
                                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-medium"
                                                )}
                                                onClick={() => {
                                                    setSelectedMovieId(m._id)
                                                    setIsOpen(false)
                                                    setSearchTerm('')
                                                }}
                                            >
                                                <span className="truncate pr-4">{m.title}</span>
                                                {selectedMovieId === m._id && <Check className="w-4 h-4 shrink-0" />}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                                            <Film className="w-8 h-8 text-slate-300" />
                                            <p className="text-sm text-slate-500 font-medium">Không tìm thấy "{searchTerm}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BIỂU ĐỒ */}
            <div className="flex-1 min-h-[300px] w-full mt-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 animate-pulse">
                        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        <span className="font-medium text-sm">Đang tải dữ liệu suất chiếu...</span>
                    </div>
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                            <YAxis
                                dataKey="startTime"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={70}
                                fontWeight="bold"
                                className="text-sm fill-slate-600 dark:fill-slate-400"
                            />
                            <XAxis type="number" hide />
                            <Tooltip
                                cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            />
                            <Bar
                                dataKey="ticketsSold"
                                name="Số vé bán được"
                                fill="url(#colorPurple)"
                                radius={[0, 8, 8, 0]}
                                barSize={28}
                            />
                            <defs>
                                <linearGradient id="colorPurple" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                        <CalendarX2 className="w-10 h-10 text-slate-300" />
                        <p className="font-medium text-sm">Chưa có lịch chiếu hoặc chưa bán được vé <br className="hidden sm:block" /> trong ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}.</p>
                    </div>
                )}
            </div>
        </div>
    )
}