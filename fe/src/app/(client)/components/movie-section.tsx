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

// Skeleton cho cái Thẻ phim kiểu mới (cũng phải chuẩn Responsive Ngang/Dọc)
function MovieCardSkeleton() {
  return (
    <div className="flex flex-row sm:flex-col bg-background rounded-xl border border-border shadow-sm overflow-hidden h-full">
      <div className="relative w-[40%] sm:w-full shrink-0 aspect-[2/3] bg-muted/30 animate-pulse" />
      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between gap-4">
        <div className="space-y-2 w-full">
          <div className="h-4 sm:h-5 bg-muted/30 rounded w-full animate-pulse" />
          <div className="h-4 sm:h-5 bg-muted/30 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-muted/30 rounded w-24 animate-pulse mt-2" />
        </div>
        <div className="h-9 sm:h-10 bg-muted/30 rounded w-full animate-pulse" />
      </div>
    </div>
  )
}

// Skeleton cho cả Section
function MovieSectionSkeleton({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <Button variant="ghost" asChild className="text-sm hover:text-[hsl(var(--primary))]">
          <Link href={viewAllHref}>
            Xem tất cả
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(5)].map((_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}

export function MovieSection({ title, movies, viewAllHref, isLoading = false }: MovieSectionProps) {
  // Loading
  if (isLoading) {
    return <MovieSectionSkeleton title={title} viewAllHref={viewAllHref} />
  }

  // Nếu không có phim
  if (movies.length === 0) {
    return (
      <section className="w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <Button variant="ghost" asChild className="text-sm hover:text-[hsl(var(--primary))]">
            <Link href={viewAllHref}>
              Xem tất cả
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
          <p className="text-muted-foreground">Không có phim nào để hiển thị.</p>
        </div>
      </section>
    )
  }

  // Lên hình giao diện chuẩn
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <Button variant="ghost" asChild className="text-sm hover:text-[hsl(var(--primary))]">
          <Link href={viewAllHref}>
            Xem tất cả
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Lưới chung: Mobile 1 cột, Tablet 2-3 cột, Desktop 4-5 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {movies.map((movie, index) => (
          <MovieCard key={movie._id} movie={movie} index={index} />
        ))}
      </div>
    </section>
  )
}