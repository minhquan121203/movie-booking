// file: src/app/(main)/profile/components/SetPasswordDialog.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useSetPassword } from '@/hooks/useSetPassword'

// Schema validate (chỉ cần mật khẩu mới và xác nhận)
const setPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

interface SetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetPasswordDialog({ open, onOpenChange }: SetPasswordDialogProps) {
  const { mutate: setPassword, isPending } = useSetPassword()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = (data: z.infer<typeof setPasswordSchema>) => {
    setPassword(
      { newPassword: data.newPassword },
      {
        onSuccess: () => {
          form.reset()
          onOpenChange(false)
          // Tùy chọn: Reload lại trang hoặc invalidate query 'me' để cập nhật trạng thái UI
          // window.location.reload();
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="w-5 h-5 text-primary" />
            Thiết lập mật khẩu
          </DialogTitle>
          <DialogDescription>
            Tài khoản Google của bạn chưa có mật khẩu. Hãy tạo mật khẩu để có thể đăng nhập bằng
            Email/Password.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showNew ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-white">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tạo mật khẩu
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
