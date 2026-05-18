import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Ticket, Info, Star } from 'lucide-react'
import type { Movie } from '@/types/movie'
import { useSchedules } from '@/lib/api/schedules'

interface MovieCardProps {
  movie: Movie
  index?: number
  showBookButton?: boolean
}

const ageRatingColors: Record<string, string> = {
  'P': 'bg-green-500',
  'C13': 'bg-yellow-500',
  'C16': 'bg-orange-500',
  'C18': 'bg-red-600',
}

export function MovieCard({ movie, showBookButton }: MovieCardProps) {
  // Chỉ fetch lịch chiếu MỘT bộ phim này nếu prop showBookButton KHÔNG được truyền vào
  const { data: scheduleData, isLoading } = useSchedules(
    { movieId: movie._id, limit: 1, includePast: false },
    { enabled: showBookButton === undefined }
  )

  // Nếu có truyền prop, ưu tiên dùng prop (như ở HeroSection).
  // Nếu không, tự quyết định: đang tải -> movie.status, tải xong -> dựa vào mảng schedules
  const finalShowBookButton = showBookButton !== undefined 
    ? showBookButton 
    : (isLoading ? movie.status === 'Đang chiếu' : (scheduleData?.schedules?.length || 0) > 0)

  const imageUrl = movie.posterUrl || "https://placehold.co/400x600?text=No+Poster"
  
  const genresText = movie.genres && movie.genres.length > 0 
    ? movie.genres.map((g: any) => g.name || g).join(", ") 
    : "Đang cập nhật"

  const ageRating = movie.rating || 'P'
  const badgeColor = ageRatingColors[ageRating] || 'bg-yellow-500'

  return (
    <div className="flex flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group h-full">
      
      {/* POSTER */}
      <Link href={`/movies/${movie._id}`} className="relative w-full shrink-0 aspect-[2/3] overflow-hidden block">
        <img 
          src={imageUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Age Rating Badge */}
        <div className={`absolute top-2 left-2 ${badgeColor} text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded shadow-md`}>
          {ageRating}
        </div>
        {/* Star Rating Badge */}
        {movie.averageRating && movie.averageRating > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-[10px] sm:text-xs font-bold px-2 py-1 rounded flex items-center gap-0.5 shadow-md">
            <Star className="w-3 h-3 fill-yellow-400" />
            {movie.averageRating.toFixed(1)}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/10 transition-colors duration-300" />
      </Link>

      {/* INFO */}
      <div className="p-3 flex flex-col flex-1">
        <div>
          <Link href={`/movies/${movie._id}`}>
            <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 uppercase hover:text-violet-600 transition-colors" title={movie.title}>
              {movie.title}
            </h3>
          </Link>
          
          <div className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
            <p className="line-clamp-1"><span className="font-semibold">Thể loại:</span> {genresText}</p>
            <p className="mt-0.5"><span className="font-semibold">Thời lượng:</span> {movie.duration} phút</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="mt-auto pt-3">
          {finalShowBookButton ? (
            <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 font-bold rounded h-8 sm:h-9 text-[11px] sm:text-sm px-2 shadow-md">
              <Link href={`/movies/${movie._id}`}>
                <Ticket className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                MUA VÉ
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full border-violet-600 text-violet-600 hover:bg-violet-50 font-bold rounded h-8 sm:h-9 text-[11px] sm:text-sm px-2">
              <Link href={`/movies/${movie._id}`}>
                <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                CHI TIẾT
              </Link>
            </Button>
          )}
        </div>
      </div>

    </div>
  )
}