'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { Loader2 } from 'lucide-react'

export default function StaffPage() {
  const router = useRouter()
  const staffTheaterId = useUserStore(state => state.staffTheaterId)
  const _hasHydrated = useUserStore(state => state._hasHydrated)

  useEffect(() => {
    // Chờ store hydrate xong
    if (!_hasHydrated) return

    // Redirect sang trang sell
    router.push('/staff/sell')
  }, [_hasHydrated, router])

  // Hiển thị loading
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-gray-600">Đang chuyển hướng...</span>
      </div>
    </div>
  )
}
