'use client'

import { Play, Star, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useMovies } from '@/lib/api/movies'
import { useMovieReviews } from '@/lib/api/reviews'
import type { Movie } from '@/types/movie'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

export function FeaturedReviews() {
  // 1. Lấy top 3 phim có rating cao nhất hoặc view cao nhất
  const { data: movieData, isLoading } = useMovies({
    limit: 3,
    sortBy: 'averageRating',
    order: 'desc',
  })

  const movies = movieData?.movies || []

  if (isLoading) return null // Hoặc Skeleton loading section

  return (
    <section className="py-16 bg-bg-secondary text-text-primary">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2 className="text-center mb-10 font-semibold text-2xl flex items-center justify-center gap-2">
          <MessageSquare className="text-primary w-6 h-6" />
          Bình luận nổi bật
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {movies.map(movie => (
            <FeaturedMovieCard key={movie._id} movie={movie} />
          ))}
        </div>

        <div className="text-center">
          <Button className="bg-gradient-to-r from-primary to-accent text-white rounded-full px-10 py-5 shadow-md hover:opacity-90">
            <ChevronDown className="w-5 h-5 mr-2" />
            Xem tiếp nhé !
          </Button>
        </div>
      </div>
    </section>
  )
}

function FeaturedMovieCard({ movie }: { movie: Movie }) {
  const { data: reviewList, isLoading } = useMovieReviews(movie._id)

  const reviews = reviewList?.reviews?.slice(0, 2) || []

  return (
    <Card className="rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md transition-all overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video group shrink-0">
        <Image
          src={movie.posterUrl || '/placeholder-movie.png'}
          fill
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />

        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href={`/movies/${movie._id}`}
            className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition"
          >
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="text-white font-medium mb-2 line-clamp-1">{movie.title}</h4>
          <div className="flex gap-2">
            <Badge className="bg-primary text-white border-0">
              {(movie.averageRating || 0).toFixed(1)} ⭐
            </Badge>
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-md">
              {movie.duration}p
            </Badge>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div
              key={review._id}
              className="border-b border-border/60 pb-3 last:border-none last:pb-0"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 border border-border">
                  <AvatarImage src={review.customer?.profilePicture} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {review.customer?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold truncate">
                      {review.customer?.fullName || 'Người dùng ẩn danh'}
                    </h5>
                    <div className="flex text-accent">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-accent" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mb-1">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-sm text-text-primary line-clamp-2 italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground italic">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button
            variant="ghost"
            asChild
            className="text-sm w-full hover:text-primary hover:bg-primary/5 transition"
          >
            <Link href={`/movies/${movie._id}`} className="flex items-center justify-center gap-1">
              Xem chi tiết & bình luận <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
