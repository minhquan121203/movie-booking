// lib/api/shift-assignments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import {
  DailyRosterResponse,
  GetDailyRosterParams,
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
  BulkAssignmentDTO,
  AssignedEmployee,
} from '@/types/shift'
import { useNotification } from '@/providers/NotificationProvider'
import axios from 'axios' // Import axios để check isCancel

// ========================================
// 1. RAW API FUNCTIONS
// ========================================

/**
 * GET /work-schedules/daily-roster
 * Lấy danh sách phân công nhân sự theo ngày
 */
// Thêm signal
export async function getDailyRoster(params: GetDailyRosterParams, signal?: AbortSignal) {
  try {
    const res = await api.get<DailyRosterResponse>('/work-schedules/daily-roster', {
      params: {
        theaterId: params.theaterId,
        date: params.date,
        shiftCode: params.shiftCode,
      },
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Failed to fetch daily roster', error)
    return null
  }
}

/**
 * GET /assignments/of-user/{userId}
 * Lấy danh sách ca làm của một nhân viên
 */
// Thêm signal
export async function getUserAssignments(
  userId: string,
  params?: {
    from?: string
    to?: string
    date?: string
    page?: number
    limit?: number
  },
  signal?: AbortSignal
) {
  try {
    const res = await api.get(`/assignments/of-user/${userId}`, {
      params,
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Failed to fetch user assignments', error)
    return { assignments: [], pagination: null }
  }
}

// --- Mutations (Không cần signal) ---

export async function bulkAssignStaff(data: BulkAssignmentDTO) {
  const res = await api.post('/assignments/bulk', data)
  return res.data
}

export async function createAssignment(data: CreateAssignmentDTO) {
  const res = await api.post('/assignments', data)
  return res.data
}

export async function updateAssignment(id: string, data: UpdateAssignmentDTO) {
  const res = await api.put(`/assignments/${id}`, data)
  return res.data
}

export async function deleteAssignment(id: string) {
  const res = await api.delete(`/assignments/${id}`)
  return res.data
}

export async function checkInAssignment(workScheduleId: string) {
  const res = await api.post('/assignments/check-in', { workScheduleId })
  return res.data
}

export async function checkOutAssignment(workScheduleId: string) {
  const res = await api.post('/assignments/check-out', { workScheduleId })
  return res.data
}

// ========================================
// 2. REACT QUERY HOOKS
// ========================================

/**
 * Hook lấy daily roster (GET)
 */
export function useDailyRoster(params: GetDailyRosterParams) {
  return useQuery({
    queryKey: ['daily-roster', params],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getDailyRoster(params, signal),
    staleTime: 1000 * 60 * 2,
    retry: 2,
    enabled: !!params.theaterId && !!params.date,
  })
}

export function useAssignmentMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  // Single Create
  const createMutation = useMutation({
    mutationFn: (data: CreateAssignmentDTO) => createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
      showSuccess('Phân công thành công')
    },
    onError: (error: any) => {
      showError('Lỗi phân công!', error.response?.data?.message || 'Vui lòng thử lại')
    },
  })

  // Bulk Create
  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkAssignmentDTO) => bulkAssignStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
      showSuccess('Phân công thành công')
    },
    onError: (error: any) => {
      showError('Lỗi phân công!', error.response?.data?.message || 'Vui lòng thử lại')
    },
  })

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssignmentDTO }) =>
      updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
      showSuccess('Cập nhật thành công')
    },
    onError: (error: any) => {
      showError('Lỗi cập nhật!', error.response?.data?.message || 'Vui lòng thử lại')
    },
  })

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
      showSuccess('Xóa phân công thành công')
    },
    onError: (error: any) => {
      showError('Lỗi xóa!', error.response?.data?.message || 'Vui lòng thử lại')
    },
  })

  // Check-in
  const checkInMutation = useMutation({
    mutationFn: (workScheduleId: string) => checkInAssignment(workScheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
      showSuccess('Check-in thành công')
    },
    onError: (error: any) => {
      showError('Lỗi check-in!', error.response?.data?.message || 'Vui lòng thử lại')
    },
  })

  // Check-out
  const checkOutMutation = useMutation({
    mutationFn: (workScheduleId: string) => checkOutAssignment(workScheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
      showSuccess('Check-out thành công')
    },
    onError: (error: any) => {
      showError('Lỗi check-out!', error.response?.data?.message || 'Vui lòng thử lại')
    },
  })

  return {
    create: createMutation,
    bulkCreate: bulkCreateMutation,
    update: updateMutation,
    remove: deleteMutation,
    checkIn: checkInMutation,
    checkOut: checkOutMutation,
  }
}

// ========================================
// 3. HOOKS FOR SPECIFIC USE CASES
// ========================================

/**
 * Hook lấy assignments của 1 user cụ thể
 */
export function useUserAssignments(
  userId: string,
  params?: {
    from?: string
    to?: string
    date?: string
    page?: number
    limit?: number
  }
) {
  return useQuery({
    queryKey: ['user-assignments', userId, params],
    // 🟢 Lấy signal
    queryFn: ({ signal }) => getUserAssignments(userId, params, signal),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  })
}

/**
 * Hook lấy assignments của 1 schedule cụ thể
 */
export function useScheduleAssignments(scheduleId: string) {
  return useQuery({
    queryKey: ['schedule-assignments', scheduleId],
    // 🟢 Lấy signal và truyền trực tiếp vào inline queryFn
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get('/assignments', {
          params: {
            workScheduleId: scheduleId,
          },
          signal, // 🟢 Truyền signal
        })
        return res.data.data
      } catch (error) {
        // 🟢 Check cancel
        if (axios.isCancel(error)) {
          throw error
        }
        console.error('Failed to fetch schedule assignments', error)
        return []
      }
    },
    staleTime: 1000 * 60 * 3,
    enabled: !!scheduleId,
  })
}
