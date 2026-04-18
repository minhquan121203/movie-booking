import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import type { Movie } from '@/types/movie'
import { MovieCard } from './MovieCard'

interface MovieSectionProps {
  title: string
  movies: Movie[]
  viewAllHref: string
}

export function MovieList({ title, movies, viewAllHref }: MovieSectionProps) {
  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {/* Movie Grid */}
      <div className={`grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-5`}>
        {movies.map((movie, index) => (
          <MovieCard key={movie._id} movie={movie} index={index} />
        ))}
      </div>
    </section>
  )
}
