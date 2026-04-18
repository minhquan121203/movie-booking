'use client'

import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from './components/ProfileHeader'
import { ProfileInfo } from './components/ProfileInfo'
import { ProfileSecurity } from './components/ProfileSecurity'
import { ProfilePreferences } from './components/ProfilePreferences'
import { Loader2 } from 'lucide-react'
import { ProfileVerification } from './components/ProfileVerification'
export default function ProfilePage() {
  const { user, isLoading, updateProfile, togglePreference } = useProfile()

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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className='flex flex-col gap-3'>
              <ProfileSecurity user={user} />
              <ProfileVerification user={user} />
              </div>
              <ProfilePreferences preferences={user.preferences} onToggle={togglePreference} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
