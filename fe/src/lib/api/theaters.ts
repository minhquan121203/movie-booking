import { TheaterListResponse } from '@/types/theater'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import axios from 'axios' // Import axios để check isCancel
import Cookies from 'js-cookie'

export interface GetTheatersParams {
  page?: number
  limit?: number
  city?: string
  search?: string
  isActive?: string
  sortBy?: string
  order?: string
}

// Thêm tham số signal
export async function getTheaters(params: GetTheatersParams = {}, signal?: AbortSignal) {
  try {
    const token = Cookies.get('authToken') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    const res = await api.get<TheaterListResponse>('/theaters', {
      params: { ...params },
      signal, // 🟢 Truyền signal vào config axios
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : undefined
    })

    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }

    console.error('Failed to fetch theaters', error)

    return {
      theaters: [],
      pagination: {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 0,
      },
    }
  }
}

export function useTheaters(params: GetTheatersParams) {
  return useQuery({
    queryKey: ['theaters', params],
    queryFn: ({ signal }) => getTheaters(params, signal),

    staleTime: 5 * 60 * 1000, // Nhớ data trong 5 phút
    refetchOnWindowFocus: false, // Tránh load lại khi khách chuyển tab trình duyệt
    placeholderData: keepPreviousData, // Giữ list cũ trên màn hình trong lúc lấy list mới
    retry: 2,
  })
}

// --- 1. DTO Types (Request Body) ---
export interface TheaterCreateDTO {
  name: string
  slug?: string
  address: string
  city: string
  district?: string
  phoneNumber?: string
  email?: string
  openingHours?: string
  // Location GeoJSON (Dựa theo ảnh Swagger)
  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  description?: string
  isActive?: boolean
}

export interface TheaterUpdateDTO extends Partial<TheaterCreateDTO> {
  isDeleted?: boolean
}

// --- Mutations (Không cần signal) ---

// CREATE
export async function createTheater(data: TheaterCreateDTO) {
  const res = await api.post('/admin/theaters', data)
  return res.data
}

// UPDATE
export async function updateTheater(id: string, data: TheaterUpdateDTO) {
  const res = await api.put(`/admin/theaters/${id}`, data)
  return res.data
}

// DELETE
export async function deleteTheater(id: string) {
  const res = await api.delete(`/admin/theaters/${id}`)
  return res.data
}
