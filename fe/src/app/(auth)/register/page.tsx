'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff, Film, User, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'
import { useRegister } from '@/hooks/useRegister'

// 1. Import thư viện
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// 2. Định nghĩa Schema Validate (Đã bỏ confirmPassword)
const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/, { message: 'Phone number must be 10-11 digits' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

// Tạo type
type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: registerUser, isPending } = useRegister()

  // 3. Khởi tạo useForm (Đã bỏ confirmPassword)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
    },
  })

  // 4. Xử lý Submit
  const onSubmit = (data: RegisterFormData) => {
    // Gửi trực tiếp data vì không còn trường thừa nào cần lọc bỏ
    registerUser(data)
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
              Offers ad-free viewing of high quality.
            </h1>
            <p className="text-white/80 text-lg">
              Join thousands of movie lovers and start your premium streaming journey today.
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

      {/* Right Side - Register Form */}
      <div className="lg:w-[60%] bg-white p-8 lg:p-12 flex items-center justify-center order-1 lg:order-2">
        <div className="max-w-md w-full space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-gray-900">Register</h2>
            <p className="text-gray-600">Create your account to start watching</p>
          </div>
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">Or register with</span>
            </div>
          </div>

          {/* Register Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm text-gray-700 font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className={`h-12 pl-10 bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus-visible:ring-primary ${
                    errors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm text-gray-700 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`h-12 pl-10 bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus-visible:ring-primary ${
                    errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm text-gray-700 font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  className={`h-12 pl-10 bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus-visible:ring-primary ${
                    errors.phoneNumber ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  {...register('phoneNumber')}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>
              )}
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
                  placeholder="Create a password"
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
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-lg mt-4"
            >
              {isPending ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
