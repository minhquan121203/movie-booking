'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Star, Clock, Calendar, User, Play, Undo2 } from 'lucide-react'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMovieDetail } from '@/lib/api/movies'
import { DEFAULT_MOVIE_DETAIL, MAXSTARS } from '@/constants'
import Link from 'next/link'
import { TrailerModal } from './TrailerModal'
import { MovieHeaderSkeleton } from './MovieHeaderSkeleton'

interface MovieHeaderProps {
  showtimes?: any[] 
}

export function MovieHeader({ showtimes = [] }: MovieHeaderProps) {
  const { id } = useParams()
  const movieId = Array.isArray(id) ? id[0] : id
  const { data: movie = DEFAULT_MOVIE_DETAIL, isLoading, error } = useMovieDetail(movieId ?? '')
  const [showTrailer, setShowTrailer] = useState(false)
  const router = useRouter()

  // Kiểm tra xem phim có lịch chiếu thực tế hay không
  const hasSchedules = showtimes && showtimes.length > 0

  if (isLoading) {
    return <MovieHeaderSkeleton />
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Lỗi khi tải thông tin phim</div>
  }

  return (
    <>
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="text-sm hover:text-violet-600 transition mb-4"
      >
        <Undo2 className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        {/* PHẦN 1: ẢNH POSTER & TRAILER */}
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

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300"></div>

          <button
            onClick={() => setShowTrailer(true)}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-violet-600/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </div>
          </button>
        </motion.div>

        {/* PHẦN 2: THÔNG TIN CHI TIẾT */}
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-text-primary uppercase tracking-tight">
              {movie.title}
            </h1>
            <div className="flex items-center gap-2">
              {[...Array(MAXSTARS)].map((_, i) => {
                const filled = i < Math.round(movie.averageRating)
                return (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${filled ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                  />
                )
              })}
              <span className="font-bold text-lg text-text-primary">
                {movie.averageRating}
              </span>
              <span className="text-sm text-text-secondary">({movie.totalReviews} đánh giá)</span>
            </div>
          </div>

          {/* Hộp thông tin nhanh */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-xl py-4 px-6 text-center bg-card shadow-sm">
              <Clock className="w-5 h-5 mx-auto text-violet-600 mb-2" />
              <p className="text-xs text-muted-foreground uppercase">Thời lượng</p>
              <p className="font-bold text-text-primary mt-1">{movie.duration} phút</p>
            </div>
            <div className="border border-border rounded-xl py-4 px-6 text-center bg-card shadow-sm">
              <Calendar className="w-5 h-5 mx-auto text-violet-600 mb-2" />
              <p className="text-xs text-muted-foreground uppercase">Khởi chiếu</p>
              <p className="font-bold text-text-primary mt-1">
                {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-2">Nội dung phim</h3>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base line-clamp-4 hover:line-clamp-none transition-all">
              {movie.description}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-violet-600" />
              <span className="text-text-secondary">Đạo diễn:</span>
              <span className="font-bold text-text-primary">{movie.director}</span>
            </p>
            <p className="flex items-start gap-2">
              <User className="w-4 h-4 text-violet-600 mt-0.5" />
              <span className="text-text-secondary whitespace-nowrap">Diễn viên:</span>
              <span className="font-bold text-text-primary">
                {movie.actors && movie.actors.join(', ')}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {movie.genres.map(genre => (
              <span
                key={genre._id}
                className="px-3 py-1 text-xs font-medium border border-border rounded-full text-muted-foreground bg-muted/30"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* PHẦN QUAN TRỌNG: NÚT ĐẶT VÉ DỰA TRÊN LỊCH CHIẾU THỰC TẾ */}
          <div className="pt-4">
            {hasSchedules ? (
              <Button
                asChild
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-14 shadow-lg shadow-violet-200 transition-all"
              >
                <Link
                  href={`/movies/${movie._id}/booking-flow`}
                  className="flex items-center justify-center w-full text-lg font-bold uppercase tracking-wide"
                >
                  Đặt vé ngay
                </Link>
              </Button>
            ) : (
              <Button
                disabled
                className="w-full bg-gray-100 text-gray-400 rounded-xl h-14 text-lg font-bold uppercase cursor-not-allowed border-2 border-dashed border-gray-200"
              >
                Chưa có lịch chiếu
              </Button>
            )}
          </div>
        </div>

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