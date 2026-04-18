import { useMutation } from '@tanstack/react-query'
import { changePasswordApi } from '@/lib/api/auth'
import type { ChangePasswordRequest } from '@/types/auth'
import { useNotification } from '@/providers/NotificationProvider'

export const useChangePassword = () => {
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePasswordApi(data),

    onSuccess: () => {
      showSuccess('Đổi mật khẩu thành công!')
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.'
      showError('Đổi mật khẩu thất bại!', message)
    },
  })
}
