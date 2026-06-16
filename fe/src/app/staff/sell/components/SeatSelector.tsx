'use client'

import { Card } from '@/components/ui/card'
import { Clock, Armchair, Loader2, Calendar } from 'lucide-react'
import { SeatMaps } from '@/app/components/shared/seatsmap'
import { Schedule } from '@/types/schedule'
import { BookedSeat } from '@/types/booking'
import type { Seat } from '@/types/theater'

interface SeatSelectorProps {
  schedules: Schedule[]
  isLoadingSchedules: boolean
  selectedSchedule: Schedule | null
  onSelectSchedule: (schedule: Schedule) => void

  selectedSeats: BookedSeat[]
  onSeatClick: (seat: Seat) => void
}

export function SeatSelector({
  schedules,
  isLoadingSchedules,
  selectedSchedule,
  onSelectSchedule,
  selectedSeats,
  onSeatClick,
}: SeatSelectorProps) {
  // Helper function để format ngày
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  // Group schedules by date
  const groupedSchedules = schedules.reduce(
    (acc, schedule) => {
      const date = schedule.showDate
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(schedule)
      return acc
    },
    {} as Record<string, Schedule[]>
  )

  const sortedDates = Object.keys(groupedSchedules).sort()

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* List Suất Chiếu */}
      <Card className="p-4 border border-gray-200 shadow-sm shrink-0 max-h-[300px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">
            Chọn suất chiếu
            {schedules.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({schedules.length} suất)
              </span>
            )}
          </h3>
        </div>

        {isLoadingSchedules ? (
          <div className="py-4 flex justify-center">
            <Loader2 className="animate-spin text-primary w-5 h-5" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-gray-400">
            <Calendar className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm font-medium">Không có suất chiếu</p>
            <p className="text-xs mt-1">Vui lòng chọn ngày khác hoặc phim khác</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map(date => (
              <div key={date} className="space-y-2">
                {/* Hiển thị ngày nếu có nhiều ngày */}
                {sortedDates.length > 1 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 pt-2 border-t first:border-t-0 first:pt-0">
                    <Calendar className="w-3 h-3" />
                    {formatDate(date)} -{' '}
                    {new Date(date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                  </div>
                )}

                {/* Danh sách suất theo ngày */}
                <div className="flex flex-wrap gap-2">
                  {groupedSchedules[date].map(schedule => (
                    <button
                      key={schedule._id}
                      onClick={() => onSelectSchedule(schedule)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all relative overflow-hidden w-full sm:w-[140px] ${
                        selectedSchedule?._id === schedule._id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary text-primary font-medium'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-start text-left">
                        {/* 🔥 HIỂN THỊ TÊN PHIM NỔI BẬT */}
                        <span className="font-bold text-blue-600 text-[11px] mb-1 line-clamp-1 w-full" title={schedule.movie?.title}>
                          {schedule.movie?.title || 'Phim đang cập nhật'}
                        </span>
                        
                        <div className="flex justify-between w-full items-end">
                          <span className="font-semibold text-gray-900 text-sm">{schedule.startTime}</span>
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">{schedule.roomName}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bản Đồ Ghế */}
      {selectedSchedule && (
        <Card className="p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Armchair className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Sơ đồ ghế: {selectedSchedule.roomName}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatDate(selectedSchedule.showDate)} - {selectedSchedule.startTime}
                </p>
              </div>
            </div>
          </div>

          {/* Container mở rộng, scroll ngang nếu phòng rộng */}
          <div className="w-full overflow-x-auto">
            <SeatMaps
              schedule={selectedSchedule}
              selectedSeats={selectedSeats}
              onSeatClick={onSeatClick}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
