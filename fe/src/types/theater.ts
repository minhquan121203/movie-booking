import type { ApiResponse } from './apiTemplate'
import type { Pagination } from './apiTemplate'

export interface Seat {
  _id?: string
  seatNumber: string // VD: "A1"
  seatType: 'Thường' | 'VIP' | 'Ghế đôi'
  isAvailable?: boolean
  row?: string
  column?: number
  price?: number
  isBooked?: boolean
  holderType?: string
  holdUntil?: string
  bookedBy?: string
  action?: string
}

export interface Room {
  roomName: string
  roomType: '2D' | '3D' | 'IMAX' | '4DX'
  totalSeats: number
  rows: number
  seatsPerRow: number
  seatMap: Seat[]
  screenType: 'Standard' | 'IMAX' | 'Dolby Atmos'
  isActive: boolean
}

// ======================
// THEATER IMAGE INTERFACE
// ======================
export interface TheaterImage {
  url: string
  publicId?: string
  caption?: string
}

// ======================
// THEATER INTERFACE
// ======================
export interface Theater {
  _id: string

  name: string
  slug?: string
  address: string
  city: string
  district?: string

  phoneNumber?: string
  email?: string

  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }

  rooms: Room[]

  amenities: string[]
  images: TheaterImage[]

  openingHours?: string
  rating: number
  totalReviews: number
  isActive: boolean

  createdBy?: string
  updatedBy?: string

  createdAt?: string | Date
  updatedAt?: string | Date

  // Virtuals
  totalRooms?: number
  totalCapacity?: number
}

// ======================
// PAGINATED RESPONSE
// ======================
export interface PaginatedTheaterResponse {
  theaters: Theater[]
  pagination: Pagination
}

export type TheaterApiResponse = ApiResponse<Theater>
export type PaginatedTheaterApiResponse = ApiResponse<PaginatedTheaterResponse>
export type TheaterListResponse = ApiResponse<PaginatedTheaterResponse>
