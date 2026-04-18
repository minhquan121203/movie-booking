import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import { ShiftTemplateResponse } from '@/types/shift'
import { useNotification } from '@/providers/NotificationProvider'
import axios from 'axios'

// --- DTO Types ---
export interface GetShiftTemplateParams {
  search?: string
  active?: boolean
}

export interface ShiftTemplateCreateDTO {
  code: string
  name: string
  startTime: string
  endTime: string
  color: string
  isActive: boolean
}

// --- Raw API Functions ---
export async function getShiftTemplates(params: GetShiftTemplateParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<ShiftTemplateResponse>('/shift-templates', {
      params,
      signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    return []
  }
}

export async function createShiftTemplate(data: ShiftTemplateCreateDTO) {
  const res = await api.post('/shift-templates', data)
  return res.data
}

export async function updateShiftTemplate(id: string, data: ShiftTemplateCreateDTO) {
  const res = await api.put(`/shift-templates/${id}`, data)
  return res.data
}

export async function deleteShiftTemplate(id: string) {
  const res = await api.delete(`/shift-templates/${id}`)
  return res.data
}

// 🆕 Hàm kích hoạt lại ca mẫu
export async function activateShiftTemplate(id: string) {
  const res = await api.patch(`/shift-templates/${id}/activate`)
  return res.data
}

// --- Custom Hooks ---
export function useShiftTemplates(params: GetShiftTemplateParams = {}) {
  return useQuery({
    queryKey: ['shift-templates', params],
    queryFn: ({ signal }) => getShiftTemplates(params, signal),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })
}

export function useShiftTemplateMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const createMutation = useMutation({
    mutationFn: (data: ShiftTemplateCreateDTO) => createShiftTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] })
      showSuccess('Tạo thành công')
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftTemplateCreateDTO }) =>
      updateShiftTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] })
      showSuccess('Cập nhập thành công')
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShiftTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] })
      showSuccess('Xoá thành công')
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  // 🆕 Mutation kích hoạt lại
  const activateMutation = useMutation({
    mutationFn: (id: string) => activateShiftTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] })
      showSuccess('Kích hoạt thành công')
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return {
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation,
    activate: activateMutation, // 🆕 Export activate
  }
}
