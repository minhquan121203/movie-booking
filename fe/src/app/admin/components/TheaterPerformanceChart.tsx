'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as BarTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, LabelList } from 'recharts'
import { MapPin, ChevronDown, Check, Store } from 'lucide-react'
import { api } from '@/lib/api/axios'
import { cn } from '@/lib/utils'

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#84cc16'];

export function TheaterPerformanceChart() {
    const [theaters, setTheaters] = useState<any[]>([])
    const [selectedTheaterId, setSelectedTheaterId] = useState<string>('')

    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState<string>(today)

    const [topMovies, setTopMovies] = useState([])
    const [genreData, setGenreData] = useState([])
    const [loading, setLoading] = useState(false)

    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchTheaters = async () => {
            try {
                const res = await api.get('/theaters?limit=100')
                if (res.data?.data?.theaters) {
                    setTheaters(res.data.data.theaters)
                    if (res.data.data.theaters.length > 0) {
                        setSelectedTheaterId(res.data.data.theaters[0]._id)
                    }
                }
            } catch (error) {
                console.error('Lỗi lấy danh sách rạp:', error)
            }
        }
        fetchTheaters()
    }, [])

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedTheaterId) return
            setLoading(true)
            try {
                const res = await api.get(`/admin/statistics/theaters/${selectedTheaterId}/performance?date=${selectedDate}`)
                if (res.data?.data) {
                    setTopMovies(res.data.data.topMovies || [])
                    setGenreData(res.data.data.genreDistribution || [])
                }
            } catch (error) {
                console.error('Lỗi lấy dữ liệu thống kê rạp:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [selectedTheaterId, selectedDate])

    const selectedTheater = theaters.find(t => t._id === selectedTheaterId)

    return (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 w-full h-full flex flex-col overflow-hidden">

            {/* HEADER FIX: Wrap linh hoạt */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-5">

                <div className="shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl shrink-0">
                            <Store className="w-5 h-5" />
                        </span>
                        <span>Phân Tích Khách Hàng Tại Rạp</span>
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:flex-1 min-w-[140px] px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
                    />

                    <div className="relative w-full sm:flex-[2] min-w-[200px]" ref={dropdownRef}>
                        <div
                            className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 pr-2">
                                <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
                                <span className="truncate">{selectedTheater ? selectedTheater.name : 'Chọn rạp...'}</span>
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                        </div>

                        {isOpen && (
                            <div className="absolute right-0 z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 p-2">
                                {theaters.map((t) => (
                                    <div
                                        key={t._id}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-3 text-sm rounded-xl cursor-pointer transition-colors mb-1 last:mb-0",
                                            selectedTheaterId === t._id
                                                ? "bg-pink-50 text-pink-700 font-bold"
                                                : "text-slate-700 hover:bg-slate-100 font-medium"
                                        )}
                                        onClick={() => { setSelectedTheaterId(t._id); setIsOpen(false); }}
                                    >
                                        <span className="truncate pr-4">{t.name}</span>
                                        {selectedTheaterId === t._id && <Check className="w-4 h-4 shrink-0 text-pink-600" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BIỂU ĐỒ */}
            <div className="flex-1 w-full flex flex-col">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[350px] text-slate-400 gap-3 animate-pulse">
                        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                        <span className="font-medium text-sm">Đang tải dữ liệu rạp...</span>
                    </div>
                ) : topMovies.length > 0 || genreData.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">

                        {/* CỘT TRÁI FIX MẤT CHỮ: Căn lề trái 30px và nới độ rộng YAxis lên 140 */}
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 flex flex-col min-h-[300px]">
                            <h4 className="text-center font-semibold text-slate-700 mb-6 shrink-0">Top 5 Phim Tại Rạp</h4>
                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* FIX LỀ DƯƠNG */}
                                    <BarChart data={topMovies} layout="vertical" margin={{ left: 30, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.3} />
                                        {/* FIX CHIỀU RỘNG */}
                                        <YAxis
                                            dataKey="title"
                                            type="category"
                                            width={140}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={(props: any) => (
                                                <text
                                                    x={10}         /* Ép dính sát lề trái của khung (cách 10px cho thoáng) */
                                                    y={props.y}
                                                    dy={4}         /* Căn giữa theo chiều dọc cho thẳng hàng với cột */
                                                    textAnchor="start" /* Bùa chú căn lề trái ở đây! */
                                                    fontSize={12}
                                                    fill="currentColor"
                                                    className="fill-slate-600 dark:fill-slate-400 font-medium"
                                                >
                                                    {props.payload.value}
                                                </text>
                                            )}
                                        />
                                        <XAxis type="number" hide />
                                        <BarTooltip cursor={{ fill: 'rgba(236, 72, 153, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="ticketsSold" name="Số vé" fill="url(#colorPink)" radius={[0, 6, 6, 0]} barSize={24}>
                                            <LabelList dataKey="ticketsSold" position="right" fill="#64748b" fontSize={12} fontWeight="bold" />
                                        </Bar>
                                        <defs>
                                            <linearGradient id="colorPink" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#f472b6" />
                                                <stop offset="100%" stopColor="#db2777" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CỘT PHẢI: THỂ LOẠI (PIE CHART) */}
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 flex flex-col min-h-[300px]">
                            <h4 className="text-center font-semibold text-slate-700 mb-2 shrink-0">Tỉ Trọng Thể Loại</h4>
                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                                        <Pie
                                            data={genreData}
                                            cx="50%" cy="45%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                                if (percent < 0.05) return null;
                                                const RADIAN = Math.PI / 180;
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                return (
                                                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                );
                                            }}
                                            labelLine={false}
                                        >
                                            {genreData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <PieTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[350px] text-slate-400 gap-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center px-4">
                        <Store className="w-10 h-10 text-slate-300" />
                        <p className="font-medium text-sm">Rạp này chưa bán được vé nào trong ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}.</p>
                    </div>
                )}
            </div>
        </div>
    )
}