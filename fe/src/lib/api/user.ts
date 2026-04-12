import { User, UserListResponse } from '@/types/user'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import { ApiResponse } from '@/types/apiTemplate'
import axios from 'axios' // Import axios để check isCancel

// --- Params ---
export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string // "customer" | "staff" | "admin"
  assignedCity?: string;
}

export interface UpdateRoleDTO {
  role: 'customer' | 'staff' | 'admin'
}

export interface CreateStaffDTO {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  assignedTheater: string
}

export interface AssignTheaterDTO {
  staffId: string
  theaterId: string
}

// --- API Functions ---

// 1. Get List
// Thêm signal
export async function getUsers(params: GetUsersParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<UserListResponse>('/admin/users', {
      params,
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch users failed', error)
    return {
      users: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    }
  }
}

// 2. Get Detail
// Thêm signal
export async function getUserDetail(id: string, signal?: AbortSignal) {
  try {
    const res = await api.get<ApiResponse<User>>(`/admin/users/${id}`, {
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    // Ném lỗi ra ngoài nếu không phải là cancel (vì hàm này không return fallback null)
    throw error
  }
}

// --- Mutations (Không cần signal) ---

// 3. Update Role
export async function updateUserRole(id: string, data: UpdateRoleDTO) {
  const res = await api.put(`/admin/users/${id}/role`, data)
  return res.data
}

// 4. Delete User
export async function deleteUser(id: string) {
  const res = await api.delete(`/admin/users/${id}`)
  return res.data
}

// 5. Create Staff
export async function createStaff(data: CreateStaffDTO) {
  const res = await api.post<ApiResponse<User>>('/admin/staff/create', data)
  return res.data.data
}

// 6. Assign Theater to Staff
export async function assignTheaterToStaff(data: AssignTheaterDTO) {
  const res = await api.post('/admin/staff/assign-theater', data)
  return res.data
}

// --- React Query Hooks ---

export function useUsers(params: GetUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getUsers(params, signal),
    staleTime: 1000 * 60 * 5,
    placeholderData: previousData => previousData,
  })
}

export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: ['user-detail', id],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getUserDetail(id!, signal),
    enabled: !!id,
  })
}
