import type { ApiResponse } from './apiTemplate'
import type { Pagination } from './apiTemplate'
import { User } from './user'
import type { Movie } from './movie'
export interface Review {
  _id: string
  customer: User
  movie: Movie
  rating: number
  comment?: string
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối'
  likesCount: number
  dislikesCount: number
  helpfulScore: number
  createdAt: string | Date
  updatedAt: string | Date
}

export interface PaginatedReviewData {
  reviews: Review[]
  pagination: Pagination
  statistics: {
    avgRating: number
    totalReviews: number
  }
}

export type ReviewApiResponse = ApiResponse<Review>
export type ReviewListResponse = ApiResponse<PaginatedReviewData>
