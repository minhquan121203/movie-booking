import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  ScheduleCreateDTO,
  ScheduleUpdateDTO,
} from '@/lib/api/schedules'
import { useNotification } from '@/providers/NotificationProvider'

export function useScheduleMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const createMutation = useMutation({
    mutationFn: (data: ScheduleCreateDTO) => createSchedule(data),
    onSuccess: () => {
      showSuccess('Tạo thành công!')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleUpdateDTO }) => updateSchedule(id, data),
    onSuccess: () => {
      showSuccess('Cập nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      showSuccess('Xoá thành công!')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { createMutation, updateMutation, deleteMutation }
}
