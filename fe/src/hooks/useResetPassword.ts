'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { resetPasswordApi } from '@/lib/api/auth'
import { ResetPasswordRequest } from '@/types/auth'
import { toast } from 'sonner'
import { useNotification } from '@/providers/NotificationProvider'

export const useResetPassword = () => {
  const router = useRouter()
  const { showSuccess, showError } = useNotification()
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPasswordApi(data),

    onSuccess: () => {
      showSuccess('Đặt lại mật khẩu thành công!', 'Vui lòng đăng nhập!')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.'
      showError('Đặt lại mật khẩu thất bại!', message)
    },
  })
}
