'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Genre } from '@/types/genre'

interface GenresProps {
  genres: Genre[]
  isLoading?: boolean
}

// Skeleton for individual genre card
function GenreCardSkeleton() {
  return (
    <div className="relative flex items-center justify-center gap-3 h-28 md:h-32 rounded-2xl border border-border bg-bg-primary overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse" />

      {/* Icon skeleton */}
      <div className="relative w-10 h-10 md:w-12 md:h-12 bg-muted/40 rounded-full animate-pulse" />

      {/* Text skeleton */}
      <div className="relative h-5 bg-muted/40 rounded w-20 md:w-24 animate-pulse" />
    </div>
  )
}

// Skeleton for entire genre grid
function GenreGridSkeleton() {
  return (
    <div className="py-12">
      <div className="container">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-7 bg-muted/30 rounded w-64 animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <GenreCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GenreGrid({ genres, isLoading = false }: GenresProps) {
  // Show skeleton while loading
  if (isLoading) {
    return <GenreGridSkeleton />
  }

  // Empty state
  if (genres.length === 0) {
    return (
      <div className="py-12">
        <div className="container">
          <h2 className="mb-8 text-start font-semibold text-foreground">Khám phá theo thể loại</h2>
          <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
            <p className="text-muted-foreground">Không có thể loại nào để hiển thị.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="container">
        <h2 className="mb-8 text-start font-semibold text-foreground">Khám phá theo thể loại</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {genres.map((genre, index) => (
            <motion.div
              key={genre.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/movies?genre=${encodeURIComponent(genre.name)}`}
                className="group block"
              >
                <div
                  className={`
                    relative flex items-center justify-center gap-3
                    h-28 md:h-32 rounded-2xl border border-border
                    bg-bg-primary transition-all duration-300
                    hover:border-transparent group-hover:shadow-lg
                    hover:-translate-y-1
                    hover:bg-gradient-to-br
                    hover:from-[var(--bg-primary)] 
                    hover:to-[var(--genre-color)]
                  `}
                  style={
                    {
                      '--bg-primary': 'var(--bg-primary)',
                      '--genre-color': genre.color,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="
                      text-3xl md:text-4xl 
                      transition-transform duration-300
                      group-hover:scale-110
                    "
                  >
                    {genre.icon}
                  </span>
                  <span
                    className="
                      text-sm md:text-base font-medium 
                      text-foreground group-hover:text-text-primary
                    "
                  >
                    {genre.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
