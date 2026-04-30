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
  isLoadingSchedules?: boolean 
}

export function MovieHeader({ showtimes = [], isLoadingSchedules = false }: MovieHeaderProps) {
  const { id } = useParams()
  const movieId = Array.isArray(id) ? id[0] : id
  const { data: movie = DEFAULT_MOVIE_DETAIL, isLoading, error } = useMovieDetail(movieId ?? '')
  const [showTrailer, setShowTrailer] = useState(false)
  const router = useRouter()

  // Logic nút bấm: Chỉ hiện nút Tím nếu thực sự có lịch chiếu trong mảng showtimes
  const hasSchedules = showtimes && showtimes.length > 0

  if (isLoading) {
    return <MovieHeaderSkeleton />
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 font-bold">Lỗi khi tải thông tin phim</div>
  }

  return (
    <>
      {/* Nút Quay lại */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="text-sm hover:text-violet-600 transition mb-4 group"
      >
        <Undo2 className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Quay lại
      </Button>

      <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        
        {/* BÊN TRÁI: POSTER & TRAILER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden border border-border shadow-lg group h-[480px] md:h-[520px] lg:h-[540px]"
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
            <div className="w-16 h-16 md:w-20 md:h-20 bg-violet-600/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </div>
          </button>
        </motion.div>

        {/* BÊN PHẢI: THÔNG TIN CHI TIẾT */}
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black mb-2 text-text-primary uppercase tracking-tight">
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
              <span className="font-bold text-lg text-text-primary ml-1">
                {movie.averageRating}
              </span>
              <span className="text-sm text-muted-foreground">({movie.totalReviews} lượt đánh giá)</span>
            </div>
          </div>

          {/* Box thông số nhanh */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-xl py-4 px-6 text-center bg-card/50 shadow-sm">
              <Clock className="w-5 h-5 mx-auto text-violet-600 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Thời lượng</p>
              <p className="font-bold text-text-primary mt-1">{movie.duration} phút</p>
            </div>
            <div className="border border-border rounded-xl py-4 px-6 text-center bg-card/50 shadow-sm">
              <Calendar className="w-5 h-5 mx-auto text-violet-600 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Khởi chiếu</p>
              <p className="font-bold text-text-primary mt-1">
                {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-2 text-lg">Nội dung</h3>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {movie.description || "Đang cập nhật nội dung cho bộ phim này..."}
            </p>
          </div>

          {/* Đạo diễn & Diễn viên */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <User className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">Đạo diễn:</span>{' '}
                <span className="font-bold text-text-primary ml-1">{movie.director}</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">Diễn viên:</span>{' '}
                <span className="font-bold text-text-primary ml-1">
                  {movie.actors && movie.actors.length > 0 ? movie.actors.join(', ') : "Đang cập nhật"}
                </span>
              </p>
            </div>
          </div>

          {/* Thể loại */}
          <div className="flex flex-wrap gap-2 pt-2">
            {movie.genres.map(genre => (
              <span
                key={genre._id}
                className="px-3 py-1 text-[11px] font-bold border border-border rounded-full text-violet-600 bg-violet-50 uppercase"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* NÚT ĐẶT VÉ CHỐT HẠ */}
          <div className="pt-6">
            {isLoadingSchedules ? (
              // Đang tải dữ liệu thì hiện nút xám chờ đợi
              <Button disabled className="w-full bg-gray-100 text-gray-400 rounded-xl h-14">
                Đang kiểm tra lịch chiếu...
              </Button>
            ) : hasSchedules ? (
              <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-14 shadow-lg">
                <Link
                  href={`/movies/${movie._id}/booking-flow`} 
                  className="flex items-center justify-center w-full py-5 text-base font-medium"
                >
                  Đặt vé ngay
                </Link>
              </Button>
            ) : (
              <Button disabled className="w-full bg-gray-100 text-gray-400 rounded-xl h-14 border-2 border-dashed border-gray-200">
                Chưa có lịch chiếu
              </Button>
            )}
          </div>
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