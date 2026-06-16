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
  // Điểm khả dụng (có thể dùng để giảm giá) - lấy từ loyalty/me (source of truth)
  availablePoints: number
  // Tổng điểm tích lũy (dùng để xét hạng, không giảm khi redeem)
  totalEarnedPoints: number
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
      availablePoints: 0,
      totalEarnedPoints: 0,

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
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }

          // 1. Lấy user data cơ bản
          const userRes = await fetch(`${apiBase}/users/me`, {
            method: 'GET',
            headers,
            credentials: 'include'
          })
          if (!userRes.ok) return

          const userData = await userRes.json()
          if (!userData?.data) return

          let mergedUser = { ...userData.data }
          let availablePoints = mergedUser.loyaltyPoints ?? 0
          let totalEarnedPoints = 0

          // 2. Lấy điểm chính xác từ /loyalty/me (source of truth)
          try {
            const loyaltyRes = await fetch(`${apiBase}/loyalty/me`, {
              method: 'GET',
              headers,
              credentials: 'include'
            })

            if (loyaltyRes.ok) {
              const loyaltyData = await loyaltyRes.json()
              if (loyaltyData?.data) {
                // points = điểm khả dụng (totalEarned - totalRedeemed)
                availablePoints = loyaltyData.data.points ?? availablePoints
                totalEarnedPoints = loyaltyData.data.totalEarned ?? 0
                mergedUser.loyaltyPoints = availablePoints
                mergedUser.membershipLevel = loyaltyData.data.level ?? mergedUser.membershipLevel
              }
            }
          } catch (loyaltyErr) {
            console.warn('⚠️ Loyalty API fallback:', loyaltyErr)
          }

          set({ user: mergedUser, isAuthenticated: true, availablePoints, totalEarnedPoints })
        } catch (error) {
          console.error('❌ Lỗi cập nhật UserStore:', error)
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        staffTheaterId: state.staffTheaterId,
        staffTheaterName: state.staffTheaterName,
        // Không persist availablePoints/totalEarnedPoints → luôn fetch tươi
      }),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },
    }
  )
)