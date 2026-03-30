'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginApi } from '@/lib/api/auth'
import { useUserStore } from '@/store/userStore'
import { LoginRequest, LoginResponse } from '@/types/auth'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { useNotification } from '@/providers/NotificationProvider'
import { api } from '@/lib/api/axios'
import { queryClient } from '@/lib/queryClient'

export const useLogin = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showSuccess, showError } = useNotification()
  const setUser = useUserStore(state => state.setUser)
  const setStaffTheater = useUserStore(state => state.setStaffTheater)
  const setStaffTheaterName = useUserStore(state => state.setStaffTheaterName)
  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),

    onSuccess: async (response: LoginResponse) => {
      const { accessToken, user } = response.data
      // 1. Lưu Cookie
      Cookies.set('authToken', accessToken, { 
        expires: 7,  
        secure: true, 
        sameSite: 'none' 
      });

      // 2. Cập nhật Store Client
      setUser(user)

      // 3. Nếu là STAFF -> Gọi thêm API /staff/profile để lấy theater_id
      const role = user.role.toLowerCase()
      if (role === 'staff') {
        try {
          const profileResponse = await api.get('/staff/profile')
          const staffInfo = profileResponse.data.data.staff.staffInfo
          // Lưu theater ID vào store
          if (staffInfo && staffInfo.assignedTheater && staffInfo.assignedTheater._id) {
            setStaffTheater(staffInfo.assignedTheater._id)
            setStaffTheaterName(staffInfo.assignedTheater.name)
          }
        } catch (error) {
          console.error('Failed to fetch staff profile:', error)
          showError('Lỗi', 'Không thể lấy thông tin rạp của nhân viên')
        }
      }

      toast.success(response.message || 'Đăng nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['me'] })
      // 4. QUAN TRỌNG: Refresh để Server Components nhận diện Cookie mới
      router.refresh()

      // 5. Điều hướng thông minh
      // Ưu tiên 1: Nếu có callbackUrl (do Middleware đẩy về), thì quay lại đó
      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl) {
        router.push(callbackUrl)
        return
      }

      // Ưu tiên 2: Điều hướng theo Role
      switch (role) {
        case 'admin':
          router.push('/admin')
          break
        case 'staff':
          router.push('/staff')
          break
        case 'customer':
        default:
          router.push('/')
          break
      }
      showSuccess('Đăng nhập thành công', 'Chào mừng bạn quay trở lại!')
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Đăng nhập thất bại'
      showError('Lỗi đăng nhập', message)
      toast.error(message)
    },
  })
}
