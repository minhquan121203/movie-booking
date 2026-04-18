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

// Skeleton for individual movie card
function MovieCardSkeleton() {
  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-2xl aspect-2/3 mb-3 bg-muted/30 animate-pulse">
        {/* Poster skeleton */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30" />

        {/* Rating badge skeleton */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-muted/50 backdrop-blur-sm rounded-lg w-12 h-6" />
      </div>

      <div className="space-y-2 px-1">
        {/* Title skeleton - 2 lines */}
        <div className="h-4 bg-muted/30 rounded w-full animate-pulse" />
        <div className="h-4 bg-muted/30 rounded w-3/4 animate-pulse" />

        {/* Duration skeleton */}
        <div className="h-3 bg-muted/30 rounded w-24 animate-pulse" />
      </div>
    </div>
  )
}

// Skeleton for entire section
function MovieSectionSkeleton({
  title,
  viewAllHref,
  isTopMovies,
}: {
  title: string
  viewAllHref: string
  isTopMovies: boolean
}) {
  // Calculate number of skeleton items based on layout
  const skeletonCount = isTopMovies ? 6 : 4

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Skeleton Grid */}
      <div
        className={`
          grid gap-6
          ${
            isTopMovies
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
          }
        `}
      >
        {[...Array(skeletonCount)].map((_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}

export function MovieSection({ title, movies, viewAllHref, isLoading = false }: MovieSectionProps) {
  const isTopMovies = title.toLowerCase().includes('top movies') || title.includes('🔥')

  // Show skeleton while loading
  if (isLoading) {
    return (
      <MovieSectionSkeleton title={title} viewAllHref={viewAllHref} isTopMovies={isTopMovies} />
    )
  }

  // Empty state
  if (movies.length === 0) {
    return (
      <section className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Empty state */}
        <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
          <p className="text-muted-foreground">Không có phim nào để hiển thị.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Movie Grid */}
      <div
        className={`
          grid gap-6
          ${
            isTopMovies
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
          }
        `}
      >
        {movies.map((movie, index) => (
          <MovieCard key={movie._id} movie={movie} index={index} />
        ))}
      </div>
    </section>
  )
}
