import { api } from '@/lib/api/axios'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios' // Import axios để check isCancel

import { User } from '@/types/user' // Đảm bảo bạn đã có type User
import { ApiResponse } from '@/types/apiTemplate' // Hoặc type response chung của bạn

// Interface cho body request (theo ảnh Swagger)
export interface UpdateProfileDTO {
  fullName?: string
  phoneNumber?: string
  // Thêm các trường khác nếu backend hỗ trợ sau này (vd: dateOfBirth)
}

export interface SetPasswordDTO {
  newPassword: string
}

// Định nghĩa response cho /auth/me
type MeResponse = ApiResponse<User>

// --- 1. API lấy thông tin user hiện tại ---

// Thêm signal
export async function getMe(signal?: AbortSignal) {
  try {
    const res = await api.get<MeResponse>('/auth/me', {
      signal, // 🟢 Truyền signal vào config axios
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel: Nếu request bị hủy, throw ngay để React Query xử lý
    if (axios.isCancel(error)) {
      throw error
    }

    // Không log lỗi 401 để tránh rác console (vì interceptor đã xử lý)
    throw error
  }
}

// --- 2. Hook useMe ---
export function useMe() {
  return useQuery({
    queryKey: ['me'], // Key định danh cho user hiện tại
    // 🟢 Lấy signal từ context và truyền vào hàm fetch
    queryFn: ({ signal }) => getMe(signal),
    staleTime: 1000 * 60 * 5, // Cache 5 phút
    retry: 1, // Thử lại 1 lần nếu lỗi
    refetchOnWindowFocus: false, // Không fetch lại khi switch tab để đỡ lag
  })
}

// --- Mutations (Không cần signal) ---

export async function updateProfileApi(data: UpdateProfileDTO) {
  // Gọi PUT /users/profile
  const res = await api.put('/users/profile', data)
  return res.data
}

export async function uploadAvatarApi(file: File) {
  const formData = new FormData()
  formData.append('avatar', file) // Tên field 'avatar' phải khớp với ảnh Postman

  const res = await api.post('/users/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

// API gọi endpoint set-password
export async function setPasswordApi(data: SetPasswordDTO) {
  const res = await api.post('/auth/set-password', data)
  return res.data
}
export interface VerifyAgeDTO {
  demo_cccd: string;
}
export async function verifyAgeApi(data: VerifyAgeDTO) {
  const res = await api.post('/user/verify-age', data);
  return res.data;
}