import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateUserRole,
  deleteUser,
  UpdateRoleDTO,
  createStaff,
  assignTheaterToStaff,
  AssignTheaterDTO,
} from '@/lib/api/user'
import { useNotification } from '@/providers/NotificationProvider'

export function useUserMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleDTO }) => updateUserRole(id, data),
    onSuccess: () => {
      showSuccess('Cập nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-detail'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      showSuccess('Xoá thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const assignTheaterMutation = useMutation({
    mutationFn: (data: AssignTheaterDTO) => assignTheaterToStaff(data),
    onSuccess: () => {
      showSuccess('Gắn rạp thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-detail'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { updateRoleMutation, deleteMutation, assignTheaterMutation }
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      showSuccess('Thêm thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUserRole(id, data), 
    onSuccess: () => {
      showSuccess('Cập nhật thông tin thành công! ✨')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-detail'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })
}