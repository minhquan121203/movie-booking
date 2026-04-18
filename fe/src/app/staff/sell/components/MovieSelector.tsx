'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Film, CalendarIcon, Calendar, Search, ChevronDown } from 'lucide-react'
import { Movie } from '@/types/movie'

interface MovieSelectorProps {
  movies: Movie[]
  selectedMovieId: string
  onSelectMovie: (id: string) => void
  selectedDate: string
  onSelectDate: (date: string) => void
  showAllDates: boolean
  onToggleAllDates: (show: boolean) => void
}

export function MovieSelector({
  movies,
  selectedMovieId,
  onSelectMovie,
  selectedDate,
  onSelectDate,
  showAllDates,
  onToggleAllDates,
}: MovieSelectorProps) {
  // State quản lý Dropdown tìm kiếm phim
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lọc phim theo từ khóa
  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Lấy tên phim đang chọn
  const selectedMovieTitle = selectedMovieId === 'ALL'
    ? '🎬 Tất cả phim'
    : movies.find(m => m._id === selectedMovieId)?.title || '-- Chọn phim --'

  return (
    <Card className="p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <Film className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">Bộ lọc suất chiếu</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* TÍNH NĂNG CHỌN PHIM CÓ SEARCH (COMBOBOX) */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="text-xs font-medium text-gray-700">Chọn Phim</label>
          <div className="relative">
            {/* Nút bấm mở Dropdown */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <span className="truncate font-medium">{selectedMovieTitle}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {/* Menu Dropdown bay lơ lửng */}
            {isOpen && (
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {/* Ô Search */}
                <div className="flex items-center border-b px-3 bg-gray-50">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
                    placeholder="Tìm kiếm phim..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                
                {/* Danh sách phim có thanh cuộn */}
                <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
                  <div
                    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-blue-50 ${selectedMovieId === 'ALL' ? 'bg-blue-50 font-bold text-primary' : ''}`}
                    onClick={() => {
                      onSelectMovie('ALL')
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    🎬 Tất cả phim
                  </div>

                  {filteredMovies.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">Không tìm thấy phim</div>
                  ) : (
                    filteredMovies.map((movie) => (
                      <div
                        key={movie._id}
                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 ${selectedMovieId === movie._id ? 'bg-blue-50 font-bold text-primary' : 'text-gray-700'}`}
                        onClick={() => {
                          onSelectMovie(movie._id)
                          setIsOpen(false)
                          setSearchQuery('')
                        }}
                      >
                        <span className="truncate">{movie.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chọn Ngày */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Ngày Chiếu</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              className="pl-9 bg-white h-10"
              value={selectedDate}
              onChange={e => {
                onSelectDate(e.target.value)
                if (showAllDates) onToggleAllDates(false)
              }}
            />
          </div>
        </div>

        {/* Nút Tất cả ngày */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Hoặc xem tất cả</label>
          <Button
            type="button"
            variant={showAllDates ? 'default' : 'outline'}
            className={`w-full h-10 ${showAllDates ? 'bg-primary text-white' : 'border-gray-300 hover:bg-gray-50'}`}
            onClick={() => onToggleAllDates(!showAllDates)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showAllDates ? 'Đang xem tất cả' : 'Tất cả ngày'}
          </Button>
        </div>
      </div>

      {/* Thông báo khi đang filter */}
      {(showAllDates || selectedMovieId === 'ALL') && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-center gap-1 flex-wrap">
            {showAllDates && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3" /> Tất cả ngày
              </span>
            )}
            {showAllDates && selectedMovieId === 'ALL' && <span className="mx-1 text-blue-300">•</span>}
            {selectedMovieId === 'ALL' && (
              <span className="flex items-center gap-1 font-medium">
                <Film className="w-3 h-3" /> Tất cả phim
              </span>
            )}
          </p>
        </div>
      )}
    </Card>
  )
}