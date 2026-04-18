import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveReview, rejectReview, deleteReview, RejectReviewDTO } from '@/lib/api/reviews'
import { useNotification } from '@/providers/NotificationProvider'

export function useReviewMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  // Duyệt
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveReview(id),
    onSuccess: () => {
      showSuccess('Đã duyệt đánh giá!')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  // Từ chối
  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectReviewDTO }) => rejectReview(id, data),
    onSuccess: () => {
      showSuccess('Từ chối đánh giá!')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  // Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      showSuccess('Đã xoá đánh giá!')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { approveMutation, rejectMutation, deleteMutation }
}
