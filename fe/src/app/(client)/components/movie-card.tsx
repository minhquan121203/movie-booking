import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Ticket, Info } from 'lucide-react'
import type { Movie } from '@/types/movie'

interface MovieCardProps {
  movie: Movie
  index?: number
  showBookButton?: boolean
}

export function MovieCard({ movie, showBookButton = true }: MovieCardProps) {
  const imageUrl = movie.posterUrl || "https://placehold.co/400x600?text=No+Poster"
  
  const genresText = movie.genres && movie.genres.length > 0 
    ? movie.genres.map((g: any) => g.name || g).join(", ") 
    : "Đang cập nhật"

  return (
    // Xóa flex-row, ép nó thành flex-col toàn tập để luôn nằm dọc
    <div className="flex flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
      
      {/* 1. ẢNH POSTER: Cho w-full để chiếm trọn bề ngang thẻ */}
      <Link href={`/movies/${movie._id}`} className="relative w-full shrink-0 aspect-[2/3] overflow-hidden block">
        <img 
          src={imageUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded shadow-md">
          T13
        </div>
      </Link>

      {/* 2. THÔNG TIN PHIM: flex-1 để nó giãn hết khoảng trống */}
      <div className="p-3 flex flex-col flex-1">
        <div>
          <Link href={`/movies/${movie._id}`}>
            {/* Giảm font-size một xíu trên mobile để 2 cột không bị vỡ chữ */}
            <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 uppercase hover:text-violet-600 transition-colors" title={movie.title}>
              {movie.title}
            </h3>
          </Link>
          
          <div className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
            <p className="line-clamp-1"><span className="font-semibold">Thể loại:</span> {genresText}</p>
            <p className="mt-0.5"><span className="font-semibold">Thời lượng:</span> {movie.duration} phút</p>
          </div>
        </div>

        {/* 3. LOGIC NÚT MUA VÉ: mt-auto là chìa khóa đẩy nút xuống sát đáy */}
        <div className="mt-auto pt-3">
          {showBookButton ? (
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