'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { Movie } from '@/types/movie'
import type { Schedule } from '@/types/schedule'

interface MovieShowtimeCardProps {
  movie: Movie
  schedules: Schedule[]
}

export default function MovieShowtimeCard({ movie, schedules }: MovieShowtimeCardProps) {
  // Sắp xếp suất chiếu theo thời gian
  const sortedSchedules = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <Card className="bg-surface border-border p-4 sm:p-5 rounded-2xl transition-all hover:border-primary/50">
      <div className="flex gap-4 sm:gap-6">
        {/* Poster */}
        <Link href={`/movies/${movie._id}`} className="shrink-0 w-[100px] sm:w-[120px]">
          <div className="aspect-2/3 relative rounded-lg overflow-hidden shadow-sm">
            <Image
              src={movie.posterUrl || '/placeholder-movie.png'}
              alt={movie.title}
              fill
              className="object-cover"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <Link
              href={`/movies/${movie._id}/booking-flow`}
              className="hover:text-primary transition-colors"
            >
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 line-clamp-2">
                {movie.title}
              </h3>
            </Link>
            <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
              <span>{movie.duration} phút</span>
              <span>•</span>
              <span>{movie.language || 'Phụ đề Tiếng Việt'}</span>
            </div>
          </div>

          {/* Danh sách giờ chiếu */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-text-secondary uppercase mb-2 block">
                2D Phụ đề
              </span>
              <div className="flex flex-wrap gap-2">
                {sortedSchedules.map(schedule => (
                  <Link
                    key={schedule._id}
                    // Link đến trang đặt vé, truyền scheduleId để tự động chọn
                    href={`/movies/${movie._id}/booking-flow?scheduleId=${schedule._id}`}
                  >
                    <ButtonTime time={schedule.startTime} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Component con hiển thị nút giờ
function ButtonTime({ time }: { time: string }) {
  return (
    <div className="px-4 py-2 rounded-lg border border-border bg-bg-secondary hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer text-sm font-medium text-text-primary flex items-center gap-1 group">
      <Clock className="w-3 h-3 text-text-secondary group-hover:text-white transition-colors" />
      {time}
    </div>
  )
}
