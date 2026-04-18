// file: src/app/(main)/profile/components/ProfileVerification.tsx
'use client'

import { useState } from 'react'
import { CheckCircle2, AlertTriangle, BadgeCheck, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { User } from '@/types/user'
import { VerifyAgeDialog } from './VerifyAgeDialog'

interface ProfileVerificationProps {
  user: User
}

export function ProfileVerification({ user }: ProfileVerificationProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  
  // Kiểm tra trạng thái từ user props
  const isVerified = user.isAgeVerified

  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border h-fit">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
          <Fingerprint className="w-6 h-6" />
        </div>
        <h3 className="text-text-primary text-lg font-bold">Định danh tài khoản</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-text-primary font-medium flex items-center gap-2">
              <BadgeCheck className={`w-4 h-4 ${isVerified ? 'text-green-500' : 'text-text-secondary'}`} />
              Trạng thái xác minh
            </p>
            <p className="text-sm text-text-secondary max-w-[300px]">
              {isVerified
                ? 'Tài khoản của bạn đã được xác minh độ tuổi và danh tính.'
                : 'Xác minh danh tính để mở khóa các tính năng giới hạn độ tuổi.'}
            </p>
          </div>

          {!isVerified && (
            <Button
              size="sm"
              onClick={() => setShowVerifyDialog(true)}
              className="bg-blue-500 text-white hover:bg-blue-600 border-none shadow-sm"
            >
              Xác minh ngay
            </Button>
          )}
        </div>

        {/* Trạng thái hiển thị Alert/Success box */}
        {isVerified ? (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Đã xác minh
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-500/80">
                Bạn đã hoàn tất xác minh qua CCCD.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900 rounded-lg p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Chưa xác minh
              </p>
              <p className="text-xs text-yellow-600/80 dark:text-yellow-500/80">
                Vui lòng cung cấp thông tin CCCD để đảm bảo quyền lợi và bảo mật tài khoản.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Render Dialog */}
      <VerifyAgeDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog} />
    </div>
  )
}