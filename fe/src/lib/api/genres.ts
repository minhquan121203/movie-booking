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
    const res = await api.get<any>('/genres', {
      params,
      signal, // 🟢 Truyền signal vào axios
    })

    const responseData = res.data;

    // 🕵️‍♂️ In ra log để xem tận mắt Backend nó nhả ra cái gì
    console.log("👉 Dữ liệu Genres từ Backend:", responseData);

    // Kịch bản 1: BE trả về { data: { items: [...] } }
    if (responseData?.data?.items) {
      return responseData.data;
    }

    // Kịch bản 2: BE trả về { data: [...] } (Chỉ có mảng)
    if (Array.isArray(responseData?.data)) {
      return { items: responseData.data, pagination: { totalPages: 1 } };
    }

    // Kịch bản 3: BE trả về trực tiếp mảng [...]
    if (Array.isArray(responseData)) {
      return { items: responseData, pagination: { totalPages: 1 } };
    }

    // Kịch bản 4: BE trả về { items: [...] }
    if (responseData?.items) {
      return responseData;
    }

    // Nếu không trúng kịch bản nào, trả về rỗng để khỏi lỗi UI
    return { items: [], pagination: { totalPages: 1 } };

  } catch (error) {
    // 🟢 Nếu request bị cancel, throw error để React Query xử lý
    if (axios.isCancel(error)) {
      throw error
    }

    console.error('Fetch genres failed', error)
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
