'use client'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import { useSchedules } from '@/lib/api/schedules'
import { useParams } from 'next/navigation'
import { DEFAULT_SCHEDULE_LIST } from '@/constants'
import Link from 'next/link'
export function ShowtimeSection() {
  const { id } = useParams()
  const movieId = Array.isArray(id) ? id[0] : id

  const { data = DEFAULT_SCHEDULE_LIST } = useSchedules({ movieId })
  const showtimes = data.schedules
  if (showtimes.length === 0) {
    return (
      <section className="py-6">
        <h2 className="text-lg font-semibold mb-4">Lịch chiếu</h2>
        <p className="text-text-secondary">Hiện chưa có lịch chiếu cho phim này.</p>
      </section>
    )
  }
  return (
    <section className="py-6">
      <h2 className="text-lg font-semibold mb-4">Lịch chiếu</h2>

      <div className="flex flex-wrap gap-4">
        {showtimes.map((show, i) => (
          <div
            key={i}
            className="flex items-center justify-between w-full md:w-[48%] border border-border rounded-2xl bg-surface px-6 py-4 hover:border-primary/60 transition-all"
          >
            <div>
              <p className="text-xl font-semibold text-primary">
                {new Date(show.showDate).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-sm text-text-primary mt-1">{show.theater.name}</p>
              <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                <MapPin className="w-3 h-3 text-primary" />
                {show.roomName}
              </div>
            </div>

            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white rounded-lg text-sm px-5 py-2"
            >
              <Link href={`/movies/${movieId}/booking-flow?scheduleId=${show._id}`} className="">
                Đặt vé
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
