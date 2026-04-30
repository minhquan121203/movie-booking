import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Ticket } from 'lucide-react'
import type { Movie } from '@/types/movie'

interface MovieCardProps {
  movie: Movie
  index?: number
}

export function MovieCard({ movie }: MovieCardProps) {
  // Lấy ảnh poster chuẩn với DB
  const imageUrl = movie.posterUrl || "https://placehold.co/400x600?text=No+Poster"
  
  // Xử lý thể loại 
  const genresText = movie.genres && movie.genres.length > 0 
    ? movie.genres.map((g: any) => g.name || g).join(", ") 
    : "Đang cập nhật"

  return (
    <div className="flex flex-row sm:flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
      {/* BÍ KÍP Ở ĐÂY: flex-row (ngang) cho mobile, sm:flex-col (dọc) cho máy tính */}
      
      {/* PHẦN 1: ẢNH POSTER */}
      <Link href={`/movies/${movie._id}`} className="relative w-[40%] sm:w-full shrink-0 aspect-[2/3] overflow-hidden block">
        <img 
          src={imageUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Nhãn T13 */}
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded shadow-md">
          T13
        </div>
      </Link>

      {/* PHẦN 2: THÔNG TIN PHIM */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Tên phim */}
          <Link href={`/movies/${movie._id}`}>
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 sm:truncate uppercase hover:text-[hsl(var(--primary))] transition-colors" title={movie.title}>
              {movie.title}
            </h3>
          </Link>
          
          {/* Thể loại & Thời lượng */}
          <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            <p className="line-clamp-1 sm:line-clamp-2"><span className="font-semibold">Thể loại:</span> {genresText}</p>
            <p className="mt-0.5 sm:mt-1"><span className="font-semibold">Thời lượng:</span> {movie.duration} phút</p>
          </div>
        </div>

        {/* NÚT MUA VÉ LUÔN HIỆN Ở ĐÁY */}
        <Button asChild className="w-full mt-3 sm:mt-4 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-primary-foreground font-bold rounded h-9 sm:h-10 text-xs sm:text-sm px-2">
          <Link href={`/booking/${movie._id}`}>
            <Ticket className="w-4 h-4 mr-1 sm:mr-2" />
            MUA VÉ
          </Link>
        </Button>
      </div>
    </div>
  )
}