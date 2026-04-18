import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateBookingStatus, deleteBooking } from '@/lib/api/booking'
import { BookingStatus } from '@/types/booking'
import { useNotification } from '@/providers/NotificationProvider'

export function useTicketMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  // Cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      showSuccess('Tạo thành công!')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  // Xóa vé
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => {
      showSuccess('Xoá thành công!')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { updateStatusMutation, deleteMutation }
}
