import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import Cookies from 'js-cookie'

interface UserState {
  user: User | null
  isAuthenticated: boolean
  staffTheaterId: string | null
  staffTheaterName: string | null
  _hasHydrated: boolean
  setUser: (user: User | null) => void
  setStaffTheater: (theaterId: string | null) => void
  setStaffTheaterName: (theaterName: string | null) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      staffTheaterId: null,
      staffTheaterName: null,
      _hasHydrated: false,

      setUser: user => set({ user, isAuthenticated: !!user }),

      setStaffTheater: theaterId => set({ staffTheaterId: theaterId }),
      setStaffTheaterName: theaterName => set({ staffTheaterName: theaterName }),

      logout: () => {
        Cookies.remove('authToken')
        set({
          user: null,
          isAuthenticated: false,
          staffTheaterId: null,
          staffTheaterName: null,
        })
      },

      setHasHydrated: state => set({ _hasHydrated: state }),

      fetchUser: async () => {
        try {
          const token = Cookies.get('authToken')
          if (!token) return

          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com'
          const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }

          // Gọi song song /users/me và /loyalty/me để lấy data mới nhất
          const [userRes, loyaltyRes] = await Promise.all([
            fetch(`${apiBase}/users/me`, { method: 'GET', headers }),
            fetch(`${apiBase}/loyalty/me`, { method: 'GET', headers }).catch(() => null)
          ])

          if (!userRes.ok) return

          const userData = await userRes.json()

          if (userData?.data) {
            let mergedUser = userData.data

            // Nếu loyalty API trả về thành công → dùng điểm từ đó (chính xác hơn)
            if (loyaltyRes?.ok) {
              try {
                const loyaltyData = await loyaltyRes.json()
                if (loyaltyData?.data) {
                  mergedUser = {
                    ...mergedUser,
                    loyaltyPoints: loyaltyData.data.points ?? mergedUser.loyaltyPoints,
                    membershipLevel: loyaltyData.data.level ?? mergedUser.membershipLevel,
                  }
                }
              } catch { /* ignore parse error */ }
            }

            set({ user: mergedUser, isAuthenticated: true })
          }
        } catch (error) {
          console.error('❌ Lỗi cập nhật UserStore:', error)
        }
      }
    }),
    {
      name: 'user-storage',
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },
    }
  )
)