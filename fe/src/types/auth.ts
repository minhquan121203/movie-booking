// types/auth.ts
import type { User } from '@/types/user'

export interface LoginRequest {
  email: string
  password: string
}

// Structure dựa trên hình ảnh Swagger (data -> token, user)
export interface LoginResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    user: User // User này phải khớp với interface trong userStore của bạn
  }
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  // Có thể có data hoặc không tùy backend, nhưng thường đăng ký chỉ cần success msg
}
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}
export interface GoogleLoginRequest {
  googleId: string
  email: string
  fullName: string
  profilePicture: string
}

export interface StaffTheaterInfo {
  _id: string
  name: string
  address: string
  city: string
}

export interface StaffInfo {
  assignedTheater: StaffTheaterInfo
  isActive: boolean
  permissions: string[]
}

export interface StaffProfileResponse {
  success: boolean
  message: string
  data: {
    staffInfo: StaffInfo
  }
}
