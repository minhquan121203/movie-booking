import { Bell, Mail, MessageSquare } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { UserProfile } from '@/types'

interface ProfilePreferencesProps {
  preferences: UserProfile['preferences']
  onToggle: (key: keyof NonNullable<UserProfile['preferences']>) => void
}

export function ProfilePreferences({ preferences, onToggle }: ProfilePreferencesProps) {
  // Nếu không có preferences thì không render hoặc render state mặc định
  if (!preferences) return null

  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <Bell className="w-5 h-5" />
        </div>
        <h3 className="text-text-primary text-lg font-bold">Tùy chọn thông báo</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <Mail className="w-5 h-5 text-text-secondary mt-0.5" />
            <div>
              <div className="text-text-primary font-medium mb-1">Email Marketing</div>
              <div className="text-text-secondary text-sm leading-relaxed max-w-[280px] sm:max-w-none">
                Nhận thông báo về các ưu đãi độc quyền, vé giảm giá và phim mới sắp ra mắt.
              </div>
            </div>
          </div>
          <Switch
            checked={preferences.emailNotification}
            onCheckedChange={() => onToggle('emailNotification')}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="h-px bg-border border-dashed" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <MessageSquare className="w-5 h-5 text-text-secondary mt-0.5" />
            <div>
              <div className="text-text-primary font-medium mb-1">Tin nhắn SMS</div>
              <div className="text-text-secondary text-sm leading-relaxed max-w-[280px] sm:max-w-none">
                Nhận tin nhắn nhắc nhở lịch chiếu và mã vé nhanh chóng.
              </div>
            </div>
          </div>
          <Switch
            checked={preferences.smsNotification}
            onCheckedChange={() => onToggle('smsNotification')}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </div>
  )
}
