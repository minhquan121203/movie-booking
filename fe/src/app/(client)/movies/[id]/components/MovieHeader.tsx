'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Star, Clock, Ticket, Calendar, User, Play, Undo2 } from 'lucide-react'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMovieDetail } from '@/lib/api/movies'
import { DEFAULT_MOVIE_DETAIL, MAXSTARS } from '@/constants'
import Link from 'next/link'
import { TrailerModal } from './TrailerModal'
import { MovieHeaderSkeleton } from './MovieHeaderSkeleton'
export function MovieHeader() {
  const { id } = useParams()
  const movieId = Array.isArray(id) ? id[0] : id
  const { data: movie = DEFAULT_MOVIE_DETAIL, isLoading, error } = useMovieDetail(movieId ?? '')
  const [showTrailer, setShowTrailer] = useState(false)
  const router = useRouter()
  if (isLoading) {
    return <MovieHeaderSkeleton />
  }

  if (error) {
    return <div>Error loading movie details</div>
  }
  return (
    <>
      <Button
        onClick={() => router.back()}
        className="text-sm hover:text-[hsl(var(--primary))] transition"
      >
        <Undo2 className="w-4 h-4" />
        Quay lại
      </Button>
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-0 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        {/* Poster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden border border-border shadow-sm group h-[480px] md:h-[520px] lg:h-[540px]"
        >
          <ImageWithFallback
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300"></div>

          {/* Play Button */}
          <button
            onClick={() => setShowTrailer(true)}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </div>
          </button>
        </motion.div>

        {/* Info Section */}
        <div className="flex flex-col space-y-6">
          {/* Title + rating */}
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-text-primary">
              {movie.title}
            </h1>
            <div className="flex items-center gap-2">
              {[...Array(MAXSTARS)].map((_, i) => {
                const filled = i < Math.round(movie.averageRating) // làm tròn rating
                return (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${filled ? 'fill-accent text-accent' : 'text-text-secondary/40'}`}
                  />
                )
              })}
              <span className="font-semibold text-lg md:text-xl text-text-primary">
                {movie.averageRating}
              </span>
              <span className="text-sm text-text-secondary">({movie.totalReviews})</span>
            </div>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Clock, label: 'Thời lượng', value: movie.duration },

              {
                icon: Calendar,
                label: 'Ra Mắt',
                value: new Date(movie.releaseDate).toLocaleDateString('vi-VN'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-border rounded-xl py-5 px-6 text-center bg-surface hover:border-primary/60 transition-all"
              >
                <item.icon className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-xs text-text-secondary">{item.label}</p>
                <p className="font-medium text-text-primary mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-text-primary mb-2">Mô tả</h3>
            <p className="text-text-secondary leading-relaxed">{movie.description}</p>
          </div>

          {/* Director & Cast */}
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>
                <span className="text-text-secondary">Đạo diễn:</span>{' '}
                <span className="font-medium text-text-primary">{movie.director}</span>
              </span>
            </p>
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>
                <span className="text-text-secondary">Diễn viên:</span>{' '}
                <span className="font-medium text-text-primary">
                  {movie.actors && movie.actors.join(', ')}
                </span>
              </span>
            </p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 pt-2">
            {movie.genres.map(genre => (
              <span
                key={genre._id}
                className="px-3 py-1 text-xs border border-border rounded-full text-text-secondary bg-bg-secondary"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Booking Button */}
          <Button
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg p-0"
          >
            <Link
              href={`/movies/${movie._id}/booking-flow`}
              className="flex items-center justify-center w-full py-5 text-base font-medium"
            >
              Đặt vé ngay
            </Link>
          </Button>
        </div>

        {/* Trailer Modal */}
        {showTrailer && (
          <TrailerModal
            setShowTrailer={setShowTrailer}
            showTrailer={showTrailer}
            src={movie.trailerUrl}
          />
        )}
      </section>
    </>
  )
}
