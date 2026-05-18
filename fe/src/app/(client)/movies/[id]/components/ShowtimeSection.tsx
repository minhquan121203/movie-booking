'use client'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import { useSchedules } from '@/lib/api/schedules'
import { DEFAULT_SCHEDULE_LIST } from '@/constants'
import Link from 'next/link'

interface ShowtimeSectionProps {
  movieId?: string; 
}

export function ShowtimeSection({ movieId }: ShowtimeSectionProps) {
  const { data = DEFAULT_SCHEDULE_LIST } = useSchedules({ movieId: movieId ?? '', limit: 500 }) // Nên lấy nhiều để đảm bảo đủ suất chiếu
  
  // Lọc bỏ những suất chiếu đã trôi qua (cả ngày cũ lẫn giờ đã chiếu xong hôm nay)
  const showtimes = (data.schedules || []).filter(show => {
    const showDate = new Date(show.showDate)
    const [hours, minutes] = show.startTime.split(':').map(Number)
    const showDateTime = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate(), hours, minutes)
    
    // Thêm 30 phút bù giờ cho phép vào muộn
    const cutoffTime = new Date(showDateTime.getTime() + 30 * 60000)
    return cutoffTime > new Date()
  })
  if (showtimes.length === 0) {
    return (
      <section className="py-6">
        <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-text-primary">Lịch chiếu</h2>
        <p className="text-text-secondary italic">Hiện chưa có lịch chiếu cho phim này.</p>
      </section>
    )
  }

  return (
    <section className="py-6">
      <h2 className="text-lg font-semibold mb-6 uppercase tracking-wider text-text-primary border-l-4 border-violet-600 pl-4">
        Lịch chiếu
      </h2>

      <div className="flex flex-wrap gap-4">
        {showtimes.map((show, i) => (
          <div
            key={show._id || i}
            className="flex items-center justify-between w-full md:w-[48%] border border-border rounded-2xl bg-card p-5 hover:border-violet-600/50 hover:shadow-md transition-all group"
          >
            <div>
              <p className="text-xl font-bold text-violet-600">
                {new Date(show.showDate).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-sm font-semibold text-text-primary mt-1">{show.theater.name}</p>
              <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                <MapPin className="w-3 h-3 text-violet-600" />
                Phòng chiếu: {show.roomName}
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 py-5"
            >
              <Link href={`/movies/${movieId}/booking-flow?scheduleId=${show._id}`}>
                Đặt vé
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}