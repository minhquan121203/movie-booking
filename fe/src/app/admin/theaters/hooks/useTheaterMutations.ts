import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTheater,
  updateTheater,
  deleteTheater,
  TheaterCreateDTO,
  TheaterUpdateDTO,
} from '@/lib/api/theaters'
import { toast } from 'sonner'
import { useNotification } from '@/providers/NotificationProvider'

export function useTheaterMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const createMutation = useMutation({
    mutationFn: (data: TheaterCreateDTO) => createTheater(data),
    onSuccess: () => {
      showSuccess('Tạo thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TheaterUpdateDTO }) => updateTheater(id, data),
    onSuccess: () => {
      showSuccess('Cập nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTheater(id),
    onSuccess: () => {
      showSuccess('Xoá thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { createMutation, updateMutation, deleteMutation }
}
