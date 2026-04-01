import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUpdateStaff } from '../hooks/useUserMutations'
import { useNotification } from '@/providers/NotificationProvider'
import { useEffect } from 'react'
import { User } from '@/types/user'

const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/

const editStaffSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  phoneNumber: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
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
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditStaffFormData>({
    resolver: zodResolver(editStaffSchema),
  })

  useEffect(() => {
    if (user && open) {
      reset({
        email: user.email || '',
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
      })
    }
  }, [user, open, reset])

  const onSubmit = async (data: EditStaffFormData) => {
    if (!user?._id) return
    try {
      await updateStaffMutation.mutateAsync({ id: user._id, data })
      showSuccess('Cập nhật nhân viên thành công!')
      onOpenChange(false)
    } catch (error: any) {
      showError('Lỗi!', error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900 min-w-fit min-h-fit overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Chỉnh Sửa Thông Tin</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4" autoComplete="off">
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
            <Input 
              id="email" 
              type="text"
              autoComplete="off"
              className={`${errors.email ? 'border-red-500' : ''}`}
              {...register('email')} 
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">Họ và tên <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              autoComplete="off"
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
              autoComplete="off"
              placeholder="0901234567"
              className={`${errors.phoneNumber ? 'border-red-500' : ''}`}
              {...register('phoneNumber')}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
          </div>

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