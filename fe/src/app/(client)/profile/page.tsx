'use client'

import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from './components/ProfileHeader'
import { ProfileInfo } from './components/ProfileInfo'
import { ProfileSecurity } from './components/ProfileSecurity'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  // Tớ đã bỏ togglePreference ra khỏi hook vì không dùng đến nữa
  const { user, isLoading, updateProfile } = useProfile()

  // 1. Hiển thị loading khi đang fetch API
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // 2. Nếu không có user (có thể do lỗi hoặc chưa login)
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-secondary">Không tìm thấy thông tin người dùng.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Background Header Decor */}
      <div className="h-48  from-primary/80 to-primary relative">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-20 pb-20 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary drop-shadow-md">Tài khoản của tôi</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left: Avatar & Quick Info */}
          <ProfileHeader user={user} />

          {/* Right: Detail Sections */}
          <div className="flex-1 space-y-6 w-full">
            <ProfileInfo user={user} onUpdate={updateProfile} />
            
            {/* Đã xóa 2 khối kia và bỏ luôn chia cột, để khối Bảo Mật nằm full chiều ngang */}
            <ProfileSecurity user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}