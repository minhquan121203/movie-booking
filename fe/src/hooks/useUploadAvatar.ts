import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadAvatarApi } from '@/lib/api/userMe'
import { toast } from 'sonner'
import { useNotification } from '@/providers/NotificationProvider'

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: (file: File) => uploadAvatarApi(file),

    onSuccess: () => {
      showSuccess('Cập nhập ảnh đại diện thành công!')
      // Làm mới dữ liệu user để hiển thị ảnh mới ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },

    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Lỗi khi tải ảnh lên'
      showError('Lỗi!', msg)
    },
  })
}
