import { api } from '@/lib/api/axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNotification } from '@/providers/NotificationProvider'

// Type Response
export interface PaymentResponse {
  paymentUrl: string
  orderId?: string
}

// API Calls
export const createVNPayUrlApi = async (bookingId: string): Promise<PaymentResponse> => {
  const res = await api.post(`/bookings/${bookingId}/payment/vnpay`)
  return res.data.data
}

export const createMoMoUrlApi = async (bookingId: string): Promise<PaymentResponse> => {
  const res = await api.post(`/bookings/${bookingId}/payment/momo`)
  return res.data.data
}

// Hooks
export const useCreateVNPayUrl = () => {
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: (bookingId: string) => createVNPayUrlApi(bookingId),
    onError: (error: any) => {
      showError('Không thể tạo link thanh toán VNPAY', 'Vui lòng thử lại!')
    },
  })
}

export const useCreateMoMoUrl = () => {
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: (bookingId: string) => createMoMoUrlApi(bookingId),
    onError: (error: any) => {
      showError('Không thể tạo link thanh toán MoMo', 'Vui lòng thử lại!')
    },
  })
}
