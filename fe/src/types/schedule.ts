import type { ApiResponse } from './apiTemplate'
import type { Pagination } from './apiTemplate'
import type { Theater, Room } from './theater'
import type { Movie } from './movie'
// Ghế của suất chiếu (seatAvailability)
export interface SeatAvailability {
  seatNumber: string
  seatType: 'Thường' | 'VIP' | 'Ghế đôi'
  isBooked: boolean
  bookedBy?: string | null // userId hoặc bookingId
  holderType?: 'user' | 'booking' // loại holder
  holdUntil?: string | null // ISO string
  action?: string
}

// Giá vé
export interface TicketPrices {
  standard: number
  vip?: number
  couple?: number
}

// Dữ liệu 1 schedule
export interface Schedule {
  _id: string
  roomType?: string

  // Thông tin phim
  movie: Movie

  // Thông tin rạp & phòng
  theater: Theater
  room: Room
  roomName: string
  // Thời gian
  showDate: string
  startTime: string
  endTime: string

  // Giá vé
  ticketPrices: TicketPrices

  // Ghế
  seatAvailability: SeatAvailability[]
  totalSeats: number
  bookedSeatsCount: number
  availableSeatsCount: number

  // Trạng thái suất chiếu
  status: 'Sắp chiếu' | 'Đang mở bán vé' | 'Sắp đầy' | 'Hết vé' | 'Đã chiếu' | 'Đã hủy'

  // Thông tin thêm
  language: string
  subtitles: string[]

  createdAt: string
  updatedAt: string

  // Virtual fields
  occupancyRate?: string // 80.21%
  isAlmostFull?: boolean
}

// Dữ liệu trả về list schedule
export interface PaginatedScheduleData {
  schedules: Schedule[]
  pagination: Pagination
}

// Kiểu API response
export type ScheduleListResponse = ApiResponse<PaginatedScheduleData>
