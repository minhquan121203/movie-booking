import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import type { Movie } from '@/types/movie'
import { MovieCard } from '@/app/(client)/components/movie-card'

interface MovieSectionProps {
  title: string
  movies: Movie[]
  viewAllHref: string
  isLoading?: boolean
}

function MovieCardSkeleton() {
  return (
    <div className="flex flex-row sm:flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden h-full">
      <div className="relative w-[40%] sm:w-full shrink-0 aspect-[2/3] bg-muted/30 animate-pulse" />
      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between gap-4">
        <div className="space-y-2 w-full">
          <div className="h-4 sm:h-5 bg-muted/30 rounded w-full animate-pulse" />
          <div className="h-4 sm:h-5 bg-muted/30 rounded w-3/4 animate-pulse" />
        </div>
        <div className="h-9 sm:h-10 bg-muted/30 rounded w-full animate-pulse mt-2" />
      </div>
    </div>
  )
}

function MovieSectionSkeleton({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="flex overflow-hidden gap-4 sm:gap-6 pb-4">
        {[...Array(6)].map((_, index) => (
          // Khung xương skeleton cũng phải rộng tương đương thẻ phim
          <div key={index} className="w-[65%] sm:w-[45%] md:w-[32%] lg:w-[22%] xl:w-[16%] shrink-0">
            <MovieCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  )
}

export function MovieSection({ title, movies, viewAllHref, isLoading = false }: MovieSectionProps) {
  
  const isComingSoon = title.toLowerCase().includes('sắp chiếu') || title.toLowerCase().includes('sắp tới');
  const showBookBtn = !isComingSoon;

  if (isLoading) {
    return <MovieSectionSkeleton title={title} viewAllHref={viewAllHref} />
  }

  if (movies.length === 0) {
    return (
      <section className="w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
          <p className="text-muted-foreground">Không có phim nào để hiển thị.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <Button variant="ghost" asChild className="text-sm hover:text-violet-600">
          <Link href={viewAllHref}>
            Xem tất cả
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* CHIẾN THUẬT MỚI: Thanh trượt vuốt ngang (ẩn thanh cuộn) */}
      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {movies.map((movie, index) => (
          /* ĐỊNH CỠ THẺ: Điện thoại chiếu 1.5 thẻ, Máy tính chiếu 6 thẻ (nhỏ bằng Top Movies) */
          <div 
            key={movie._id} 
            className="w-[65%] sm:w-[45%] md:w-[32%] lg:w-[22%] xl:w-[16%] shrink-0 snap-start"
          >
            <MovieCard 
              movie={movie} 
              index={index} 
              showBookButton={isComingSoon ? false : undefined} 
            />
          </div>
        ))}
      </div>
    </section>
  )
}