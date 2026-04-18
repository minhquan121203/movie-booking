import { format } from 'date-fns' // Hoặc dùng new Date().toLocaleDateString()
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Check, X, Trash2 } from 'lucide-react'
import { Review } from '@/types/review'

interface ReviewTableProps {
  reviews: Review[]
  isLoading: boolean
  onApprove: (id: string) => void
  onRejectClick: (id: string) => void
  onDeleteClick: (id: string) => void
}

export function ReviewTable({
  reviews,
  isLoading,
  onApprove,
  onRejectClick,
  onDeleteClick,
}: ReviewTableProps) {
  if (isLoading) return <div className="text-center py-10">Đang tải...</div>
  if (reviews.length === 0)
    return <div className="text-center py-10 text-gray-500">Không có đánh giá nào.</div>

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Đã duyệt':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đã duyệt</Badge>
      case 'Bị từ chối':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Từ chối</Badge>
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Chờ duyệt</Badge>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map(review => (
        <div
          key={review._id}
          className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-md transition-all flex flex-col h-full"
        >
          {/* Header: User Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-gray-100">
                <AvatarImage src={review.customer?.profilePicture || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {review.customer?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {review.customer?.fullName || 'Unknown User'}
                </h4>
                <p
                  className="text-xs text-gray-500 line-clamp-1 max-w-[150px]"
                  title={review.movie.title || ''}
                >
                  {review.movie.title}{' '}
                  {/* Nếu review.movie là ID thì cần populate từ BE, hoặc hiển thị ID */}
                </p>
              </div>
            </div>
            {getStatusBadge(review.status)}
          </div>

          {/* Rating Stars */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">
              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Comment */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1 italic bg-gray-50 p-3 rounded-lg">
            &quot;{review.comment}&quot;
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            {review.status === 'Chờ duyệt' && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                  onClick={() => onApprove(review._id)}
                >
                  <Check className="w-4 h-4 mr-1" /> Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 h-8 px-3"
                  onClick={() => onRejectClick(review._id)}
                >
                  <X className="w-4 h-4 mr-1" /> Từ chối
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:bg-red-50"
              onClick={() => onDeleteClick(review._id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
