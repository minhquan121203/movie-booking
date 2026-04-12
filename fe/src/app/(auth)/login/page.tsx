'use client'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { Loader2 } from 'lucide-react'
import { useState, Suspense } from 'react' 
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff, Film, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'
import { useLogin } from '@/hooks/useLogin'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập email' })
    .email({ message: 'Email không hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
})

type LoginFormData = z.infer<typeof loginSchema>

// Đổi tên function cũ thành LoginContent (bỏ export default đi)
function LoginContent() {
  const [showPassword, setShowPassword] = useState(false)
  const { login: googleLogin, isPending: isGoogleLoading } = useGoogleAuth()
  const { mutate: login, isPending, error, isError } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormData) => {
    login({ email: data.email, password: data.password })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Purple Block */}
      <div className="lg:w-[40%] bg-[#6c63ff] text-white p-8 lg:p-12 flex flex-col justify-center items-center order-2 lg:order-1">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <Film className="w-8 h-8" />
            </div>
            <span className="text-2xl font-semibold">CineBooking</span>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              The biggest international and local film streaming.
            </h1>
            <p className="text-white/80 text-lg">
              Watch your favorite movies anytime, anywhere with our premium streaming service.
            </p>
          </div>

          {/* Image */}
          <div className="pt-8">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1760999896198-b7e780e42500?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBkZXNrJTIwc3RyZWFtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzYzNDg2MTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Streaming Setup"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-[60%] bg-white p-8 lg:p-12 flex items-center justify-center order-1 lg:order-2">
        <div className="max-w-md w-full space-y-8">
          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-gray-900">Hey there, welcome back.</h2>
          </div>

          {/* Google Login Button */}
          <Button
            variant="outline"
            className="w-full h-12 border-2 hover:bg-gray-50 text-gray-700 hover:text-gray-700/50 relative"
            onClick={() => googleLogin()}
            disabled={isGoogleLoading}
            type="button"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-3 " viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isGoogleLoading ? 'Đang kết nối Google...' : 'Login with Google'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">Or login with</span>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm text-gray-700 font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus-visible:ring-primary ${
                  errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm text-gray-700 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`h-12 pl-10 pr-10 bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus-visible:ring-primary ${
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Error Message */}
            {isError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>
                  {(error as any)?.response?.data?.message ||
                    'Email hoặc mật khẩu không chính xác. Vui lòng thử lại!'}
                </span>
              </div>
            )}

            {/* Login Button */}
            <Button
              disabled={isPending}
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-lg"
            >
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Bọc cái khiên Suspense ở ngoài cùng này
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  )
}