import axios from 'axios'
import Cookies from 'js-cookie'
import { useUserStore } from '@/store/userStore'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Biến cờ để kiểm soát việc Refresh Token
let isRefreshing = false
// Hàng đợi lưu các request bị lỗi chờ refresh xong
let failedQueue: Array<{
  resolve: (token: string | null) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request Interceptor
api.interceptors.request.use(
  config => {
    const token = Cookies.get('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response Interceptor với logic Refresh Token
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const isLoginRequest = originalRequest.url && originalRequest.url.includes('/auth/login')
    const isRefreshRequest =
      originalRequest.url && originalRequest.url.includes('/auth/refresh-token')
    const isStaffProfileRequest =
      originalRequest.url && originalRequest.url.includes('/staff/profile')

    // Không xử lý 401 cho login, refresh, và staff profile request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginRequest &&
      !isRefreshRequest &&
      !isStaffProfileRequest
    ) {
      if (isRefreshing) {
        // Nếu đang refresh, đưa request vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Gọi API refresh token
        const { data } = await api.post('/auth/refresh-token')

        const newAccessToken = data.data.accessToken

        // Lưu token mới
        Cookies.set('authToken', newAccessToken, {
          expires: 1 / 24, // 1 giờ
          secure: true, 
          sameSite: 'none',
        })

        // Cập nhật header mặc định
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

        // Xử lý queue
        processQueue(null, newAccessToken)

        // Gọi lại request ban đầu bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh thất bại (Hết hạn cả Refresh Token hoặc bị khóa)
        processQueue(refreshError, null)

        // Logout & Redirect
        Cookies.remove('authToken')
        useUserStore.getState().logout() // Gọi hàm logout của store để clear state UI
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname

          const protectedPaths = ['/admin', '/staff', '/profile', '/order-history', '/booking']

          if (protectedPaths.some(path => currentPath.startsWith(path))) {
            window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`
          } else {
            window.location.reload()
          }
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
