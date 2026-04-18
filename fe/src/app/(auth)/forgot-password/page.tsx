'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Film, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForgotPassword } from '@/hooks/useForgotPassword' // 1. Import hook

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập địa chỉ email' })
    .email({ message: 'Địa chỉ email không hợp lệ' }),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  // 2. Sử dụng hook
  const { mutate: sendForgotPassword, isPending } = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  // 3. Xử lý Submit thật
  const onSubmit = (data: ForgotPasswordFormData) => {
    sendForgotPassword(data.email, {
      onSuccess: () => {
        // Chỉ chuyển sang màn hình thông báo khi API thành công
        setIsSubmitted(true)
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 font-sans">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Header Section (Giữ nguyên) */}
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="flex items-center justify-center p-2 rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary tracking-tight">CineBooking</span>
          </Link>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
            <p className="text-text-secondary text-sm">Recover your account password via email</p>
          </div>
        </div>

        {/* Form Section */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-text-primary ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className={`
                    h-12 pl-10 bg-[var(--input-background)] border-border text-text-primary 
                    placeholder:text-text-secondary/70 focus-visible:ring-primary focus-visible:border-primary 
                    rounded-xl transition-all
                    ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                  `}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs ml-1 font-medium animate-in slide-in-from-top-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending} // Disable khi đang gọi API
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        ) : (
          // Success State (Giữ nguyên)
          <div className="text-center bg-card p-6 rounded-2xl border border-border shadow-sm animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Check your email</h3>
            <p className="text-text-secondary text-sm mb-6">
              We have sent password recovery instructions to your email address.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="w-full border-border text-text-primary hover:bg-bg-secondary rounded-xl h-11"
            >
              Try another email
            </Button>
          </div>
        )}

        {/* Footer Link (Giữ nguyên) */}
        <div className="text-center text-sm">
          <span className="text-text-secondary">Remember your password? </span>
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            Login
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1 hidden group-hover:block" />
          </Link>
        </div>
      </div>
    </div>
  )
}
