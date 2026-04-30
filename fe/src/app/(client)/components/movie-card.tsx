import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Ticket } from 'lucide-react'
import type { Movie } from '@/types/movie'

interface MovieCardProps {
  movie: Movie
  index?: number
}

export function MovieCard({ movie }: MovieCardProps) {
  // Đã xóa thumbnail, image đi. Chỉ giữ lại posterUrl cho chuẩn với DB của fen
  const imageUrl = movie.posterUrl || "https://placehold.co/400x600?text=No+Poster"
  
  // Xử lý thể loại 
  const genresText = movie.genres && movie.genres.length > 0 
    ? movie.genres.map((g: any) => g.name || g).join(", ") 
    : "Đang cập nhật"

  return (
    <div className="flex flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
      
      {/* Đã xóa slug, chỉ dùng movie._id */}
      <Link href={`/movies/${movie._id}`} className="relative w-full aspect-[2/3] overflow-hidden block">
        <img 
          src={imageUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Fix cứng T13 (Hoặc fen có thể đổi thành 'HOT') vì DB fen chưa có trường ageRating */}
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-black px-2 py-1 rounded shadow-md">
          T13
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        {/* Đã xóa slug */}
        <Link href={`/movies/${movie._id}`}>
          <h3 className="text-lg font-bold text-foreground truncate uppercase hover:text-[hsl(var(--primary))] transition-colors" title={movie.title}>
            {movie.title}
          </h3>
        </Link>
        
        <div className="mt-1 text-sm text-muted-foreground flex-grow">
          <p className="line-clamp-1"><span className="font-semibold">Thể loại:</span> {genresText}</p>
          <p><span className="font-semibold">Thời lượng:</span> {movie.duration} phút</p>
        </div>

        {/* Đã xóa slug ở nút Mua vé */}
        <Button asChild className="w-full mt-4 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-primary-foreground font-bold rounded">
          <Link href={`/booking/${movie._id}`}>
            <Ticket className="w-4 h-4 mr-2" />
            MUA VÉ
          </Link>
        </Button>
      </div>

    </div>
  )
}