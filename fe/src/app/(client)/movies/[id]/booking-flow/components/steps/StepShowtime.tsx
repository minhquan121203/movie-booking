// src/features/booking/components/steps/StepShowtime.tsx

import { Clock, MapPin, Calendar, Loader2 } from 'lucide-react'
import { Schedule } from '@/types/schedule'
import { useRouter } from 'next/navigation'

interface StepShowtimeProps {
  movieTitle: string
  schedules: Schedule[]
  isLoading: boolean
  selectedSchedule: Schedule | null
  onSelect: (schedule: Schedule) => void
}

export function StepShowtime({
  movieTitle,
  schedules,
  isLoading,
  selectedSchedule,
  onSelect,
}: StepShowtimeProps) {
  const router = useRouter()

  // Format giờ chiếu (HH:mm)
  const formatTime = (time?: string) => time?.slice(0, 5) || '--:--'

  // Format ngày chiếu chuẩn timezone Việt Nam
  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        })
      : '--/--/----'

  // Format giá vé
  const formatPrice = (price?: number) =>
    (price || 0).toLocaleString('vi-VN') + ' đ'

  return (
    <div>
      <h2 className="mb-6 text-text-primary text-xl font-bold">
        Chọn suất chiếu – {movieTitle}
      </h2>

      {/* Case 1: Đang tải */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-text-secondary">
            Đang tải lịch chiếu...
          </span>
        </div>
      )}

      {/* Case 2: Không có lịch chiếu */}
      {!isLoading && schedules.length === 0 && (
        <div className="text-center py-10 bg-surface border border-border rounded-xl">
          <p className="text-text-secondary">
            Hiện chưa có lịch chiếu cho phim này.
          </p>
        </div>
      )}

      {/* Case 3: Hiển thị danh sách */}
      {!isLoading && schedules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map(schedule => (
            <div
              key={schedule._id}
              onClick={() => {
                onSelect(schedule)
                router.push(
                  `/movies/${schedule.movie._id}/booking-flow?scheduleId=${schedule._id}`
                )
              }}
              className={`bg-surface rounded-2xl p-5 cursor-pointer transition-all duration-300 border-2 ${
                selectedSchedule?._id === schedule._id
                  ? 'border-primary shadow-md bg-primary/5'
                  : 'border-border hover:border-primary/30 hover:bg-bg-secondary'
              }`}
            >
              {/* Time + Room type */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-text-primary font-semibold text-lg">
                    {formatTime(schedule.startTime)}
                  </span>
                </div>

                <div className="px-2 py-1 rounded bg-bg-secondary text-xs font-medium text-text-secondary border border-border">
                  {schedule.roomType || '2D'}
                </div>
              </div>

              {/* Theater + Date */}
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {schedule.theater?.name || 'Rạp chưa xác định'} •{' '}
                    {schedule.roomName || 'Phòng ?'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(schedule.showDate)}</span>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <span className="text-text-secondary text-sm">
                  Giá vé từ
                </span>

                <span className="text-primary font-bold text-lg">
                  {formatPrice(schedule.ticketPrices?.standard)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}