import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Mail, Phone, Calendar, CreditCard, Loader2 } from 'lucide-react'
import { useUserDetail } from '@/lib/api/user'

interface UserDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
}

export function UserDetailSheet({ open, onOpenChange, userId }: UserDetailSheetProps) {
  // Fetch detail data khi mở sheet
  const { data: user, isLoading } = useUserDetail(userId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-gray-50 text-gray-900">
        <SheetHeader>
          <SheetTitle>Thông Tin Người Dùng</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        ) : user ? (
          <div className="mt-6 space-y-6">
            {/* Header Info */}
            <div className="flex flex-col items-center">
              <Avatar className="w-24 h-24 mb-4 border-4 border-gray-50">
                <AvatarImage src={user.profilePicture} alt={user.fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {user.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{user.fullName}</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
                {user.membershipLevel || 'Thành viên'}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <InfoItem icon={Mail} label="Email" value={user.email} />
              <InfoItem icon={Phone} label="Số Điện Thoại" value={user.phoneNumber} />
              <InfoItem
                icon={Calendar}
                label="Ngày Tham Gia"
                value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-semibold mb-4 text-gray-900">Thống Kê</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Tổng Vé" value={user.spending?.totalBookings || 0} />
                <StatCard label="Đã Chi Tiêu" value={`${user.spending?.totalSpent} đ`} />{' '}
                {/* Cần trường totalSpent từ BE */}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center py-10 text-red-500">Không tìm thấy thông tin user.</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '---'}</p>
      </div>
    </div>
  )
}
function StatCard({ label, value }: any) {
  return (
    <Card className="p-4 bg-gray-50 border-none shadow-none">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </Card>
  )
}
