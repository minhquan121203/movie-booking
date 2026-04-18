import { useMutation } from '@tanstack/react-query'
import { setPasswordApi } from '@/lib/api/userMe'
import { useNotification } from '@/providers/NotificationProvider'
export function useSetPassword() {
  const { showSuccess, showError } = useNotification()
  return useMutation({
    mutationFn: setPasswordApi,
    onSuccess: () => {
      showSuccess('Thiết lập mật khẩu thành công!')
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi thiết lập mật khẩu')
    },
  })
}
