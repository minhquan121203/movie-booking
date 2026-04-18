'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff, Film } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useResetPassword } from '@/hooks/useResetPassword' // Import Hook

// Schema Validation
const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Lấy token từ URL
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Gọi hook Reset Password
  const { mutate: resetPassword, isPending } = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      // Xử lý nếu URL không có token
      return
    }

    // Gọi API
    resetPassword({
      token: token,
      newPassword: data.password,
    })
  }

  // Nếu không có token, hiện thông báo lỗi
  if (!token) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-xl border border-red-100 text-red-600">
        <h3 className="font-bold text-lg">Liên kết không hợp lệ</h3>
        <p className="text-sm">Vui lòng kiểm tra lại đường dẫn trong email của bạn.</p>
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* New Password */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#111827]">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            className={`h-12 pl-10 pr-10 bg-white border-gray-200 text-black placeholder:text-gray-400 focus-visible:ring-[#6c63ff] ${
              errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#111827]">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            className={`h-12 pl-10 pr-10 bg-white border-gray-200 text-black placeholder:text-gray-400 focus-visible:ring-[#6c63ff] ${
              errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
            }`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-[#6c63ff] hover:bg-[#5a52d5] text-white font-medium text-base rounded-xl shadow-lg shadow-[#6c63ff]/25 transition-all active:scale-[0.98]"
      >
        {isPending ? 'Processing...' : 'Confirm'}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 font-sans">
      <div className="w-full max-w-[400px] space-y-8">
        {/* --- HEADER LOGO --- */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#6c63ff] p-2 rounded-lg shadow-lg shadow-[#6c63ff]/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#111827] tracking-tight">CineBooking</span>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-[#111827]">Create New Password</h1>
            <p className="text-gray-500 text-sm">Enter your new password below</p>
          </div>
        </div>

        {/* --- FORM SECTION (Wrapped in Suspense) --- */}
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
