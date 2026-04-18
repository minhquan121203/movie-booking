import { ScheduleListResponse } from '@/types/schedule'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import axios from 'axios' // Import axios để check isCancel

// --- DTO Types ---

export interface TicketPriceDTO {
  standard: number
  vip: number
  couple: number
}

export interface ScheduleCreateDTO {
  movieId: string
  theaterId: string
  roomId: string
  roomName: string // Backend yêu cầu gửi cả tên
  roomType: '2D' | '3D' | 'IMAX'
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  ticketPrices: TicketPriceDTO
  language: string
  subtitles: string[]
  status?: string
}

export interface ScheduleUpdateDTO extends Partial<ScheduleCreateDTO> {
  isActive?: boolean
}

// Hợp nhất 2 interface GetScheduleParams trùng tên trong file cũ thành 1
export interface GetScheduleParams {
  movieId?: string
  theaterId?: string
  showDate?: string // Filter theo ngày
  date?: string // (Giữ lại field này nếu BE dùng cả 2 tên, nếu không nên thống nhất 1 cái)
  page?: number
  limit?: number
  includePast?: boolean
}

// --- API Functions ---

// Thêm signal
export async function getSchedules(params: GetScheduleParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<ScheduleListResponse>('/schedules', {
      params, // axios tự build query string
      signal, // 🟢 Truyền signal
    })

    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }

    console.error('Failed to fetch schedules', error)

    return {
      schedules: [],
      pagination: {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 0,
      },
    }
  }
}

// --- Mutations (Không cần signal) ---

export async function createSchedule(data: ScheduleCreateDTO) {
  const res = await api.post('/admin/schedules', data)
  return res.data
}

export async function updateSchedule(id: string, data: ScheduleUpdateDTO) {
  const res = await api.put(`/admin/schedules/${id}`, data)
  return res.data
}

export async function deleteSchedule(id: string) {
  const res = await api.delete(`/admin/schedules/${id}`)
  return res.data
}

// --- Hooks ---

export function useSchedules(params: GetScheduleParams = {}) {
  return useQuery({
    queryKey: ['schedules', params],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getSchedules(params, signal),
    staleTime: 1000 * 60 * 10, // cache 10 phút
    retry: 2,
  })
}
