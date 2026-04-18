import { Genre, GenreListResponse, GenreListData } from '@/types/genre'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import axios from 'axios' // Import axios để check isCancel

// --- 1. DTO Types (Data Transfer Objects) ---
export interface GenreCreateDTO {
  name: string
  slug?: string // Có thể auto-generate ở BE
  description?: string
  icon?: string
  color?: string
}

export interface GenreUpdateDTO extends Partial<GenreCreateDTO> {
  isActive?: boolean
}

export interface GetGenresParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

// --- 2. API Functions ---

// Thêm tham số signal
export async function getGenres(params: GetGenresParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<GenreListResponse>('/genres', {
      params,
      signal, // 🟢 Truyền signal vào axios
    })
    return res.data.data
  } catch (error) {
    // 🟢 Nếu request bị cancel, throw error để React Query xử lý
    if (axios.isCancel(error)) {
      throw error
    }

    console.error('Fetch genres failed', error)
    // Fallback data khi lỗi thật sự (không phải do cancel)
    return {
      items: [],
      pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
    } as GenreListData
  }
}

export async function createGenre(data: GenreCreateDTO) {
  const res = await api.post('/admin/genres', data)
  return res.data
}

export async function updateGenre(id: string, data: GenreUpdateDTO) {
  const res = await api.put(`/admin/genres/${id}`, data)
  return res.data
}

export async function deleteGenre(id: string) {
  const res = await api.delete(`/admin/genres/${id}`)
  return res.data
}

// --- 3. Hooks ---

export function useGenres(params: GetGenresParams) {
  return useQuery({
    queryKey: ['genres', params],
    // 🟢 Lấy signal từ context và truyền vào hàm fetch
    queryFn: ({ signal }) => getGenres(params, signal),
    staleTime: 1000 * 60 * 5, // 5 phút
    placeholderData: previousData => previousData,
  })
}
