'use client'

import { useState } from 'react' // 👇 Thêm import useState
import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from './components/ProfileHeader'
import { ProfileInfo } from './components/ProfileInfo'
import { ProfileSecurity } from './components/ProfileSecurity'
import { LoyaltyTab } from './components/LoyaltyTab'
import { Loader2, User, Star } from 'lucide-react'

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useProfile()

  const [activeTab, setActiveTab] = useState<'info' | 'loyalty'>('info')

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
      <div className="h-48 from-primary/80 to-primary relative">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-20 pb-20 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary drop-shadow-md">Tài khoản của tôi</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left: Avatar & Quick Info (Cột trái giữ nguyên luôn hiện) */}
          <ProfileHeader user={user} />

          {/* Right: Detail Sections & Tabs (Cột phải sẽ biến đổi theo Tab) */}
          <div className="flex-1 w-full">

            {/* ============ THANH CHUYỂN TAB ============ */}
            <div className="flex gap-6 border-b border-border mb-6 px-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'info'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                <User className="w-4 h-4" />
                Thông tin cá nhân
                {activeTab === 'info' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('loyalty')}
                className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'loyalty'
                  ? 'text-amber-500'
                  : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                <Star className="w-4 h-4" />
                Điểm thưởng & Ưu đãi
                {activeTab === 'loyalty' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>
                )}
              </button>
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'info' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ProfileInfo user={user} onUpdate={updateProfile} />
                  <ProfileSecurity user={user} />
                </div>
              )}

              {activeTab === 'loyalty' && (
                <LoyaltyTab />
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}