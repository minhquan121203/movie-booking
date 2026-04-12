'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' 
import { useForm, Controller } from 'react-hook-form' 
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUpdateStaff } from '../hooks/useUserMutations'
import { useNotification } from '@/providers/NotificationProvider'
import { useEffect } from 'react'
import { User } from '@/types/user'
import { VIETNAM_CITIES } from '@/lib/location'

const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/

const editStaffSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  phoneNumber: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
  assignedCity: z.string().optional(), 
})

type EditStaffFormData = z.infer<typeof editStaffSchema>

interface EditStaffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null 
}

export function EditStaffModal({ open, onOpenChange, user }: EditStaffModalProps) {
  const { showSuccess, showError } = useNotification()
  const updateStaffMutation = useUpdateStaff()

  const {
    register,
    handleSubmit,
    control, 
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditStaffFormData>({
    resolver: zodResolver(editStaffSchema),
  })

  // Đổ dữ liệu cũ vào form mỗi khi mở modal hoặc đổi user
  useEffect(() => {
    if (user && open) {
      reset({
        email: user.email || '',
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        assignedCity: user.assignedCity || '', 
      })
    }
  }, [user, open, reset])

  const onSubmit = async (data: EditStaffFormData) => {
    if (!user?._id) return
    try {
      // Gửi toàn bộ data (gồm cả assignedCity) lên server
      await updateStaffMutation.mutateAsync({ id: user._id, data })
      showSuccess('Cập nhật thông tin thành công! ✨')
      onOpenChange(false)
    } catch (error: any) {
      showError('Lỗi!', error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900 min-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {user?.role === 'admin' ? 'Chỉnh Sửa Quản Lý Vùng' : 'Chỉnh Sửa Thông Tin'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4" autoComplete="off">
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
            <Input 
              id="email" 
              type="text"
              className={`${errors.email ? 'border-red-500' : ''}`}
              {...register('email')} 
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">Họ và tên <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              className={`${errors.fullName ? 'border-red-500' : ''}`}
              {...register('fullName')}
            />
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Số điện thoại <span className="text-red-500">*</span></Label>
            <Input
              id="phoneNumber"
              placeholder="0901234567"
              className={`${errors.phoneNumber ? 'border-red-500' : ''}`}
              {...register('phoneNumber')}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
          </div>

          {/* PHẦN CHỈ HIỆN KHI SỬA ADMIN */}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-600 italic">Khu vực quản lý hiện tại</Label>
              <Controller
                name="assignedCity"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-blue-50 border-blue-200">
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {VIETNAM_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}