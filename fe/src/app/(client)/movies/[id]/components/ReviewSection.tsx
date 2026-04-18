'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Star, Loader2, Clock, MessageSquarePlus, LogIn } from 'lucide-react'
import { toast } from 'sonner' // Giả sử bạn dùng thư viện toast (như sonner hoặc react-hot-toast)

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { useMovieReviews, useCreateReview } from '@/lib/api/reviews'
import { useUserStore } from '@/store/userStore'
import { useMounted } from '@/hooks/useMounted' // Sử dụng hook useMounted đã tạo ở bước trước
import { DEFAULT_REVIEW_LIST } from '@/constants'
import type { Review } from '@/types/review'
import { cn } from '@/lib/utils'

// --- 1. SUB-COMPONENT: REVIEW ITEM (Memoized) ---
const ReviewItem = memo(({ review, currentUserId }: { review: Review; currentUserId?: string }) => {
  const isOwn = currentUserId === review.customer._id
  const isPending = review.status === 'Chờ duyệt'

  // Format date
  const formattedDate = useMemo(() => {
    return new Date(review.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [review.createdAt])

  return (
    <div className={cn('py-4 first:pt-0', isPending && isOwn && 'opacity-75')}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-border">
          <AvatarImage src={review.customer.profilePicture || ''} alt={review.customer.fullName} />
          <AvatarFallback className="text-xs md:text-sm">
            {review.customer.fullName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header: Name, Date, Status */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-semibold text-sm md:text-base truncate">
              {review.customer.fullName}
              {isOwn && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(Bạn)</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">• {formattedDate}</span>

            {isPending && isOwn && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] font-medium rounded-full">
                <Clock className="w-3 h-3" /> Chờ duyệt
              </span>
            )}
          </div>

          {/* Stars */}
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5 md:w-4 md:h-4',
                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'
                )}
              />
            ))}
          </div>

          {/* Comment */}
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  )
})
ReviewItem.displayName = 'ReviewItem'

// --- 2. SUB-COMPONENT: REVIEW FORM (Isolated State) ---
interface ReviewFormProps {
  movieId: string
  onSuccess?: () => void
}

const ReviewForm = ({ movieId, onSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const { mutate: submitReview, isPending } = useCreateReview()

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá')
      return
    }

    submitReview(
      { movie: movieId, rating, comment },
      {
        onSuccess: () => {
          toast.success('Đánh giá của bạn đã được gửi và đang chờ duyệt!')
          setComment('')
          setRating(5)
          onSuccess?.()
        },
        onError: () => {
          toast.error('Có lỗi xảy ra, vui lòng thử lại sau.')
        },
      }
    )
  }

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-4 md:p-6 mb-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquarePlus className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-base">Viết đánh giá của bạn</h3>
      </div>

      <div className="flex flex-col gap-4">
        {/* Rating Select */}
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              className="p-1 -ml-1 focus:outline-none transition-transform hover:scale-110"
              disabled={isPending}
            >
              <Star
                className={cn(
                  'w-6 h-6 md:w-8 md:h-8 transition-colors',
                  (hoverRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/40'
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-muted-foreground">
            {hoverRating || rating}/5 sao
          </span>
        </div>

        {/* Text Input */}
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nghĩ của bạn về bộ phim..."
          className="min-h-[120px] resize-none bg-background focus-visible:ring-primary/50"
          disabled={isPending}
        />

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isPending || !comment.trim()}
            className="min-w-[140px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi đánh giá'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- 3. MAIN COMPONENT ---
export function ReviewSection() {
  const { id } = useParams()
  const movieId = Array.isArray(id) ? id[0] : id

  // Auth & Hydration check
  const { user, isAuthenticated } = useUserStore()
  const isMounted = useMounted()

  // Fetch Data
  const { data = DEFAULT_REVIEW_LIST, isLoading } = useMovieReviews(movieId ?? '')
  const reviews = data.reviews || []

  // Filter Logic (Memoized)
  const visibleReviews = useMemo(() => {
    if (!isMounted) return []

    return reviews.filter(review => {
      // 1. Luôn hiện review đã duyệt
      if (review.status === 'Đã duyệt') return true
      // 2. Hiện review chờ duyệt NẾU là của chính user đó
      if (review.status === 'Chờ duyệt' && user?._id === review.customer._id) return true

      return false
    })
  }, [reviews, user?._id, isMounted])

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <section className="py-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          Đánh giá từ người xem
          <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {visibleReviews.length}
          </span>
        </h2>
      </div>

      {/* Auth Guard for Form */}
      {isMounted && isAuthenticated ? (
        <ReviewForm movieId={movieId ?? ''} />
      ) : (
        <div className="bg-muted/50 border border-dashed border-border rounded-xl p-8 text-center mb-8">
          <p className="text-muted-foreground mb-4">
            Bạn cần đăng nhập để viết đánh giá cho bộ phim này.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/login?redirect=/movies/${movieId}`}>
              <LogIn className="w-4 h-4" />
              Đăng nhập ngay
            </Link>
          </Button>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {visibleReviews.length > 0 ? (
          <div className="divide-y divide-border rounded-xl border border-border bg-card px-4 md:px-6">
            {visibleReviews.map(review => (
              <ReviewItem key={review._id} review={review} currentUserId={user?._id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <MessageSquarePlus className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          </div>
        )}
      </div>
    </section>
  )
}
