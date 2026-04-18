import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createGenre,
  updateGenre,
  deleteGenre,
  GenreCreateDTO,
  GenreUpdateDTO,
} from '@/lib/api/genres'
import { useNotification } from '@/providers/NotificationProvider'

export function useGenreMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  // Thêm mới
  const createMutation = useMutation({
    mutationFn: (data: GenreCreateDTO) => createGenre(data),
    onSuccess: () => {
      showSuccess('Tạo thành công!')
      queryClient.invalidateQueries({ queryKey: ['genres'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GenreUpdateDTO }) => updateGenre(id, data),
    onSuccess: () => {
      showSuccess('Cập nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['genres'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  // Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGenre(id),
    onSuccess: () => {
      showSuccess('Xoá thành công!')
      queryClient.invalidateQueries({ queryKey: ['genres'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { createMutation, updateMutation, deleteMutation }
}
