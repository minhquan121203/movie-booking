import { ReviewListResponse } from '@/types/review'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import { useNotification } from '@/providers/NotificationProvider'
import axios from 'axios' // Import axios để check isCancel

// --- Params ---
export interface GetReviewsParams {
  page?: number
  limit?: number
  search?: string // Tìm theo tên phim hoặc tên user
  rating?: number // 1-5
  status?: 'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối'
}
export interface CreateReviewDTO {
  movie: string | undefined
  rating: number
  comment: string
}
export interface RejectReviewDTO {
  reason: string
}

// Thêm signal
export async function getMovieReviews(movieId: string, signal?: AbortSignal) {
  try {
    const res = await api.get<ReviewListResponse>(`/reviews/movie/${movieId}`, {
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch reviews failed', error)
    return {
      reviews: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      statistics: { avgRating: 0, totalReviews: 0 },
    }
  }
}

// 1. Get List (Admin)
// Thêm signal
export async function getReviews(params: GetReviewsParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<ReviewListResponse>('/admin/reviews', {
      params,
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch reviews failed', error)
    return {
      reviews: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      statistics: { avgRating: 0, totalReviews: 0 },
    }
  }
}

export async function createReview(data: CreateReviewDTO) {
  const res = await api.post(`/reviews`, data)
  return res.data
}
// 2. Approve Review
export async function approveReview(id: string) {
  const res = await api.put(`/admin/reviews/${id}/approve`)
  return res.data
}

// 3. Reject Review (Có lý do)
export async function rejectReview(id: string, data: RejectReviewDTO) {
  const res = await api.put(`/admin/reviews/${id}/reject`, data)
  return res.data
}

// 4. Delete Review
export async function deleteReview(id: string) {
  const res = await api.delete(`/admin/reviews/${id}`)
  return res.data
}

// --- Hooks ---

export function useReviews(params: GetReviewsParams) {
  return useQuery({
    queryKey: ['reviews', params],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getReviews(params, signal),
    staleTime: 1000 * 60 * 5, // 5 phút
    placeholderData: previousData => previousData,
  })
}

export function useMovieReviews(movieId: string) {
  return useQuery({
    queryKey: ['reviews', movieId],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getMovieReviews(movieId, signal),
    staleTime: 1000 * 60 * 5, // 5 phút
    placeholderData: previousData => previousData,
  })
}

export function useCreateReview() {
  const { showSuccess, showError } = useNotification()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReviewDTO) => createReview(data),
    onSuccess: () => {
      showSuccess('Đã gửi yêu cầu đánh giá') // Sửa typo: đánh gái -> đánh giá
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })
}
