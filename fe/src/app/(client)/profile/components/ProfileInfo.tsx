import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { UserProfile } from '@/types'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phoneNumber: z.string().min(10, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
})

interface ProfileInfoProps {
  user: UserProfile
  onUpdate: (data: Partial<UserProfile>) => void
}
const InfoItem = ({ label, value }: { label: string; value?: string }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 py-2 border-b border-dashed border-border last:border-0">
    <span className="text-text-secondary text-sm font-medium">{label}</span>
    <span className="text-text-primary font-medium">{value || 'Chưa cập nhật'}</span>
  </div>
)
export function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      // dateOfBirth: user.dateOfBirth || '',
    },
  })

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    onUpdate(values)
    setIsEditing(false)
  }

  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-primary text-lg font-bold">Thông tin cá nhân</h3>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary hover:bg-primary/10 gap-2"
          >
            <Pencil className="w-4 h-4" /> Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            >
              <X className="w-4 h-4" /> Hủy
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-2">
          <InfoItem label="Họ và tên" value={user.fullName} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Số điện thoại" value={user.phoneNumber} />
          {/* <InfoItem label="Ngày sinh" value={user.dateOfBirth} /> */}
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 animate-in fade-in slide-in-from-top-2"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-center space-y-0">
                  <FormLabel className="text-text-secondary font-normal">Họ và tên</FormLabel>
                  <div className="w-full">
                    <FormControl>
                      <Input {...field} className="bg-bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-center space-y-0">
                  <FormLabel className="text-text-secondary font-normal">Email</FormLabel>
                  <div className="w-full">
                    <FormControl>
                      <Input {...field} disabled className="bg-muted text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-center space-y-0">
                  <FormLabel className="text-text-secondary font-normal">Số điện thoại</FormLabel>
                  <div className="w-full">
                    <FormControl>
                      <Input {...field} className="bg-bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-center space-y-0">
                  <FormLabel className="text-text-secondary font-normal">Ngày sinh</FormLabel>
                  <div className="w-full">
                    <FormControl>
                      <Input {...field} type="date" className="bg-bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            /> */}

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 gap-2 text-white">
                <Check className="w-4 h-4" /> Lưu thay đổi
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
