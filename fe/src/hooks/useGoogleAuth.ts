'use client'

import { useGoogleLogin } from '@react-oauth/google'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { googleLoginApi } from '@/lib/api/auth'
import { useUserStore } from '@/store/userStore'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import axios from 'axios' // Dùng axios thường để gọi Google API
import { GoogleLoginRequest } from '@/types/auth'
import { useNotification } from '@/providers/NotificationProvider'

export const useGoogleAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showSuccess, showError } = useNotification()

  const setUser = useUserStore(state => state.setUser)

  // 1. Mutation gọi API Backend (Bước cuối)
  const { mutate: loginWithBackend, isPending } = useMutation({
    mutationFn: (data: GoogleLoginRequest) => googleLoginApi(data),

    onSuccess: response => {
      const { accessToken, user } = response.data

      Cookies.set('authToken', accessToken, { 
        expires: 7,  
        secure: true, 
        sameSite: 'none' 
      });

      setUser(user)
      showSuccess('Đăng nhập Google thành công!')
      router.refresh()

      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        const role = user.role.toLowerCase()
        if (role === 'admin') router.push('/admin')
        else if (role === 'staff') router.push('/staff')
        else router.push('/')
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Đăng nhập với Server thất bại'
      showError(message)
    },
  })

  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        // Có access_token -> Gọi Google API lấy info
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })

        const { sub, email, name, picture } = userInfo.data

        // Chuẩn bị dữ liệu đúng format Backend yêu cầu
        const payload: GoogleLoginRequest = {
          googleId: sub, // Backend: googleId
          email: email, // Backend: email
          fullName: name, // Backend: fullName
          profilePicture: picture, // Backend: profilePicture
        }

        // Gửi về Backend
        loginWithBackend(payload)
      } catch (error) {
        console.error('Error fetching Google user info:', error)
        showError('Lỗi đăng nhập', 'Đăng nhập với Google thất bại')
      }
    },
    onError: error => {
      console.error('Google Login Failed:', error)
      showError('Lỗi đăng nhập', '')
    },
    // Lưu ý: KHÔNG dùng flow: 'auth-code' nữa, mặc định là 'implicit' để lấy access_token
  })

  return {
    login,
    isPending,
  }
}
