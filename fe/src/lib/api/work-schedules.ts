// lib/api/work-schedules.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import {
  WorkSchedule,
  GenerateWorkScheduleDTO,
  GetWorkScheduleParams,
  WorkScheduleResponseData,
} from '@/types/work-schedule'
import { useNotification } from '@/providers/NotificationProvider'
import axios from 'axios' // Import axios để check isCancel

// --- 1. Raw API Functions ---

// GET: Lấy danh sách lịch làm việc
// Thêm signal
export async function getWorkSchedules(params: GetWorkScheduleParams, signal?: AbortSignal) {
  try {
    const res = await api.get<WorkScheduleResponseData>('/work-schedules', {
      params,
      signal, // 🟢 Truyền signal vào config axios
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }

    console.error('Failed to fetch work schedules', error)
    // Ném lỗi ra để React Query handle (vì ta không có cấu trúc fallback cụ thể ở đây)
    throw error
  }
}

// POST: Sinh lịch làm việc tự động
export async function generateWorkSchedules(data: GenerateWorkScheduleDTO) {
  const res = await api.post('/work-schedules/generate', data)
  return res.data
}

// DELETE: Xóa một lịch làm việc
export async function deleteWorkSchedule(id: string) {
  const res = await api.delete(`/work-schedules/${id}`)
  return res.data
}

// --- 2. Custom Hooks (React Query) ---

// Hook lấy danh sách lịch (Tự động refetch khi params thay đổi)
export function useWorkSchedules(params: GetWorkScheduleParams) {
  return useQuery({
    // Query Key bao gồm params để cache riêng biệt cho từng tháng/rạp
    queryKey: ['work-schedules', params],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getWorkSchedules(params, signal),
    // Chỉ fetch khi có theaterId (để tránh gọi lỗi khi chưa chọn rạp)
    enabled: !!params.theaterId && !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  })
}

// Hook Mutation cho các hành động thay đổi dữ liệu
export function useWorkScheduleMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  // Generate Schedule Mutation
  const generateMutation = useMutation({
    mutationFn: (data: GenerateWorkScheduleDTO) => generateWorkSchedules(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-schedules'] })
      showSuccess('Tạo lịch thành công')
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  // Delete Schedule Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] })
      showSuccess('Xoá lịch thành công')
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return {
    generate: generateMutation,
    remove: deleteMutation,
  }
}
