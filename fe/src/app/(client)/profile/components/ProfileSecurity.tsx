// file: src/app/(main)/profile/components/ProfileSecurity.tsx
'use client'

import { useState } from 'react'
import { Shield, KeyRound, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChangePasswordDialog } from './ChangePasswordDialog' // Dialog cũ của bạn
import { SetPasswordDialog } from './SetPasswordDialog' // Dialog mới vừa tạo
import { User } from '@/types/user'

// Props cần nhận vào user để check logic
interface ProfileSecurityProps {
  user: User
}

export function ProfileSecurity({ user }: ProfileSecurityProps) {
  const [showChangePass, setShowChangePass] = useState(false)
  const [showSetPass, setShowSetPass] = useState(false)
  console.log(user)
  // Logic kiểm tra: Nếu user chưa có pass (login GG) -> hasPassword = false
  const hasPassword = user.authProviders.includes('local') ?? false

  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border h-fit">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-text-primary text-lg font-bold">Bảo mật</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-text-primary font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-text-secondary" />
              Mật khẩu
            </p>
            <p className="text-sm text-text-secondary max-w-[280px]">
              {hasPassword
                ? 'Nên thay đổi mật khẩu định kỳ để bảo vệ tài khoản.'
                : 'Bạn đang đăng nhập bằng Google và chưa có mật khẩu riêng.'}
            </p>
          </div>

          {hasPassword ? (
            // Trường hợp 1: Đã có pass -> Hiện nút Đổi pass
            <Button variant="outline" size="sm" onClick={() => setShowChangePass(true)}>
              Đổi mật khẩu
            </Button>
          ) : (
            // Trường hợp 2: Chưa có pass -> Hiện nút Tạo pass
            <Button
              size="sm"
              onClick={() => setShowSetPass(true)}
              className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200 hover:border-yellow-300 border"
            >
              <Lock className="w-3 h-3 mr-2" /> Thiết lập
            </Button>
          )}
        </div>

        {/* Phần cảnh báo nếu chưa có pass */}
        {!hasPassword && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 rounded-lg p-3 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Chưa thiết lập mật khẩu
              </p>
              <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
                Hiện tại bạn chỉ có thể đăng nhập bằng Google. Hãy thiết lập mật khẩu nếu muốn đăng
                nhập bằng Email/Password.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Render Dialogs */}
      <ChangePasswordDialog open={showChangePass} onOpenChange={setShowChangePass} />
      <SetPasswordDialog open={showSetPass} onOpenChange={setShowSetPass} />
    </div>
  )
}
