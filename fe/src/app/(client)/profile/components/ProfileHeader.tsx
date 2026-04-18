'use client'

import { useRef, useCallback, memo } from 'react'
import { Loader2, Camera, User, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner' // Giả sử bạn dùng sonner hoặc thư viện toast tương tự

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/types'
import { useUploadAvatar } from '@/hooks/useUploadAvatar'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  user: UserProfile
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export const ProfileHeader = memo(({ user }: ProfileHeaderProps) => {
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Xử lý chọn file
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]

      if (!file) return

      // 1. Validate Size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.')
        // Reset input để có thể chọn lại file khác ngay lập tức
        event.target.value = ''
        return
      }

      // 2. Validate Type (Client side check)
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Định dạng file không hỗ trợ. Vui lòng chọn JPG, PNG hoặc WEBP.')
        event.target.value = ''
        return
      }

      // 3. Upload
      uploadAvatar(file, {
        onSuccess: () => {
          // Reset input sau khi upload thành công
          if (fileInputRef.current) fileInputRef.current.value = ''
          toast.success('Cập nhật ảnh đại diện thành công!')
        },
        onError: () => {
          if (fileInputRef.current) fileInputRef.current.value = ''
          toast.error('Có lỗi xảy ra khi tải ảnh lên.')
        },
      })
    },
    [uploadAvatar]
  )

  // Trigger input click
  const triggerFileInput = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }, [isUploading])

  // Support Keyboard (Enter/Space to upload)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerFileInput()
    }
  }

  return (
    <div className="w-full lg:w-[320px] shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-sm border border-border sticky top-24">
        <div className="flex flex-col items-center text-center">
          {/* Avatar Wrapper - Interactive */}
          <div
            className={cn(
              'mb-6 relative group rounded-full transition-transform duration-200',
              !isUploading && 'cursor-pointer hover:scale-105 active:scale-95',
              isUploading && 'cursor-not-allowed opacity-80'
            )}
            onClick={triggerFileInput}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Thay đổi ảnh đại diện"
          >
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl">
              <AvatarImage src={user.profilePicture} alt={user.fullName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl sm:text-4xl font-bold">
                {user.fullName?.charAt(0).toUpperCase() || <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>

            {/* Hover/Loading Overlay */}
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-black/50 rounded-full transition-all duration-300 backdrop-blur-[2px]',
                isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <div className="flex flex-col items-center text-white animate-in zoom-in-50 duration-200">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Đổi ảnh</span>
                </div>
              )}
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {/* User Info */}
          <div className="space-y-1 w-full">
            <h2 className="text-foreground text-xl font-bold truncate px-2" title={user.fullName}>
              {user.fullName}
            </h2>
            <p className="text-muted-foreground text-sm truncate px-2" title={user.email}>
              {user.email}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge
              variant="secondary"
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold capitalize',
                user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'
              )}
            >
              {user.role === 'customer' ? 'Khách hàng' : user.role}
            </Badge>

            {user.membershipLevel && (
              <Badge
                variant="outline"
                className="border-yellow-500/50 text-yellow-600 dark:text-yellow-500 gap-1 px-3 py-1"
              >
                <BadgeCheck className="w-3 h-3" />
                {user.membershipLevel}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

ProfileHeader.displayName = 'ProfileHeader'
