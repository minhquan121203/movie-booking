import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateTicket } from '@/lib/api/booking'
import { useNotification } from '@/providers/NotificationProvider'

export function useConfirmTicket() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const confirmTicket = useMutation({
    mutationFn: (bookingCode: string) => validateTicket(bookingCode),
    onSuccess: () => {
      showSuccess('Vé hợp lệ')
      queryClient.invalidateQueries({ queryKey: ['booking'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { confirmTicket }
}
