'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Clock, Loader2, MapPin } from 'lucide-react'
import DateSelector from './DateSelector'
import SelectedCinemaHeader from './SelectedCinemaHeader'
import MovieShowtimeCard from './MovieShowtimeCard'
import type { Theater } from '@/types/theater'
import type { Schedule } from '@/types/schedule'
import type { Movie } from '@/types/movie'
import { se } from 'date-fns/locale'

type ShowtimeContentProps = {
  selectedDate: string | undefined
  onSelectDate: (date: string | undefined) => void
  selectedCinema: Theater | null
  schedules: Schedule[]
  checkCinema: boolean
  isLoading?: boolean
}

// Định nghĩa lại kiểu dữ liệu cho nhóm để bao gồm cả thông tin ngày
type GroupedMovieSchedule = {
  uniqueKey: string
  date: string // Ngày chiếu (YYYY-MM-DD)
  movie: Movie
  schedules: Schedule[]
}

export default function ShowtimeContent({
  selectedDate,
  onSelectDate,
  selectedCinema,
  schedules,
  checkCinema,
  isLoading = false,
}: ShowtimeContentProps) {
  const groupedData = useMemo(() => {
    // 1. Lọc theo ngày (nếu người dùng có chọn ngày trên DateSelector)
    let filtered = schedules
    if (selectedDate && selectedDate.trim() !== '') {
      // Chuyển đổi selectedDate từ DD/MM/YYYY sang YYYY-MM-DD
      const [day, month, year] = selectedDate.split('/')
      const formattedSelectedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      filtered = schedules.filter(s => {
        const scheduleDate = s.showDate.split('T')[0]
        return scheduleDate === formattedSelectedDate
      })
    }

    // 2. Gom nhóm theo: MOVIE_ID + DATE
    const groups: Record<string, GroupedMovieSchedule> = {}

    filtered.forEach(schedule => {
      // Lấy phần ngày (bỏ giờ). Giả sử showDate là ISO string "2024-11-28T10:00..."
      const dateKey = schedule.showDate.split('T')[0]
      const movieId = schedule.movie._id

      // Tạo key duy nhất kết hợp giữa phim và ngày
      const uniqueKey = `${movieId}_${dateKey}`

      if (!groups[uniqueKey]) {
        groups[uniqueKey] = {
          uniqueKey,
          date: dateKey,
          movie: schedule.movie,
          schedules: [],
        }
      }
      groups[uniqueKey].schedules.push(schedule)
    })

    // 3. Chuyển thành mảng và Sắp xếp
    return Object.values(groups).sort((a, b) => {
      // Ưu tiên sắp xếp theo ngày trước (tăng dần)
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      // Nếu cùng ngày thì sắp xếp theo tên phim
      return a.movie.title.localeCompare(b.movie.title)
    })
  }, [schedules, selectedDate])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Selector */}
      <DateSelector selectedDate={selectedDate} onSelectDate={onSelectDate} />

      <Card className="bg-accent/10 border-accent/30 p-3 sm:p-4 rounded-2xl">
        <div className="flex items-center gap-2 text-text-primary">
          <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-accent shrink-0" />
          <span className="text-sm sm:text-base font-medium">
            Lịch chiếu có thể thay đổi. Vui lòng kiểm tra kỹ trước khi đặt vé.
          </span>
        </div>
      </Card>

      {/* --- LOGIC HIỂN THỊ CHÍNH --- */}

      {/* 1. Chưa chọn Rạp */}
      {!checkCinema || !selectedCinema ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center">
            <MapPin className="w-8 h-8 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Chưa chọn rạp chiếu</h3>
            <p className="text-text-secondary">Vui lòng chọn khu vực và rạp để xem lịch chiếu.</p>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
          <SelectedCinemaHeader
            cinemaName={selectedCinema.name || ''}
            address={selectedCinema.address || ''}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : groupedData.length > 0 ? (
            <div className="space-y-4">
              {groupedData.map(({ uniqueKey, movie, schedules, date }) => (
                <div key={uniqueKey} className="flex flex-col gap-2">
                  {/* Tùy chọn: Nếu không chọn ngày cụ thể, có thể hiển thị thêm Header ngày ở đây để phân biệt */}
                  {!selectedDate && (
                    <span className="text-sm font-bold text-text-secondary ml-1 ">
                      Ngày: {new Date(date).toLocaleDateString('vi-VN')}
                    </span>
                  )}

                  <MovieShowtimeCard movie={movie} schedules={schedules} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface border border-border border-dashed rounded-2xl">
              <p className="text-text-secondary">Không tìm thấy suất chiếu nào vào ngày này.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
