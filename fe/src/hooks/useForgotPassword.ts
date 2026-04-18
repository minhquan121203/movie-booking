'use client'

import { useMutation } from '@tanstack/react-query'
import { forgotPasswordApi } from '@/lib/api/auth'
import { toast } from 'sonner' // Hoặc thư viện toast bạn đang dùng
import { useNotification } from '@/providers/NotificationProvider'

export const useForgotPassword = () => {
  const { showSuccess, showError } = useNotification()
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),

    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.'
      showError('Lỗi!', message)
    },
  })
}
