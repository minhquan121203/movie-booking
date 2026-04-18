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
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
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
    }),
    {
      name: 'user-storage',
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },
    }
  )
)
