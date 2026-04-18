'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'
import type { Movie } from '@/types/movie'

interface MovieCardProps {
  movie: Movie
  index?: number
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/movies/${movie._id}`} className="block">
        {/* Poster Container */}
        <div className="relative aspect-2/3 overflow-hidden rounded-lg mb-3 bg-gray-200">
          <ImageWithFallback
            height={200}
            width={200}
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Rating Badge */}
          {movie.averageRating && (
            <div className="absolute top-2 left-2 bg-yellow-500 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span className="text-white text-xs font-bold">{movie.averageRating}</span>
            </div>
          )}
        </div>

        {/* Movie Info */}
        <div className="space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {movie.duration && (
              <>
                <span>{movie.duration} phút</span>
                <span>•</span>
              </>
            )}
            <span className="line-clamp-1">
              {movie.genres ? movie.genres.map(mg => mg.name).join(', ') : 'Chưa có thể loại'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
