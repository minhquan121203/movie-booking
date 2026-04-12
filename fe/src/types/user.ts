import type { ApiResponse } from './apiTemplate'
import type { Pagination } from './apiTemplate'

export interface StaffInfo {
  staffId?: string
  assignedTheater?: {
    name: string
    _id: string
  } // _id của Theater
  position?: 'cashier' | 'usher' | 'supervisor' | 'manager'
  shift?: 'morning' | 'afternoon' | 'evening' | 'night'
  hireDate?: string | Date
  salary?: number
  isActive?: boolean
  permissions?: string[]
}

export interface User {
  _id: string
  username?: string
  email: string
  name?: string
  fullName: string
  phoneNumber?: string
  profilePicture?: string
  cloudinaryPublicId?: string
  role: 'customer' | 'staff' | 'admin' | 'super-admin'
  assignedCity?: string;
  staffInfo?: StaffInfo
  authProviders: string[]
  googleId?: string
  facebookId?: string
  loyaltyPoints: number
  membershipLevel: 'Bạc' | 'Vàng' | 'Bạch kim'
  permissions: string[]
  isActive: boolean
  isEmailVerified: boolean
  isPhoneVerified: boolean
  lastLogin?: string | Date
  createdAt?: string | Date
  updatedAt?: string | Date
  spending?: {
    totalSpent: number
    totalBookings: number
    completedBookings: number
    cancelledBookings: number
  }
  // Virtuals
  bookingsCount?: number
  reviewsCount?: number
  isAdmin?: boolean
  nextMembershipLevel?: string
  isAgeVerified: string
}

export interface PaginatedUserResponse {
  users: User[]
  pagination: Pagination
}

export type UserApiResponse = ApiResponse<User>
export type PaginatedUserApiResponse = ApiResponse<PaginatedUserResponse>
export type UserListResponse = ApiResponse<PaginatedUserResponse>
