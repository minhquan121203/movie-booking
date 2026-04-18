import { api } from '@/lib/api/axios'
import { Room, Seat } from '@/types/theater' // Import từ file theater.ts của bạn
import { isValid } from 'date-fns'

// --- DTO Types ---
export interface RoomCreateDTO {
  roomName: string
  roomType: '2D' | '3D' | 'IMAX' | '4DX'
  totalSeats: number
  rows: number
  seatsPerRow: number
  screenType: 'Standard' | 'IMAX' | 'Dolby Atmos'
  isActive: boolean
  seatMap: Seat[] // BE yêu cầu gửi map ghế lên
}

export interface RoomUpdateDTO extends Partial<RoomCreateDTO> {
  isValid?: boolean
}

// --- API Functions ---

// Lưu ý: Không có API getRooms riêng lẻ, ta lấy từ Theater

// CREATE: POST /admin/theaters/{theaterId}/rooms
export async function createRoom(theaterId: string, data: RoomCreateDTO) {
  const res = await api.post(`/admin/theaters/${theaterId}/rooms`, data)
  return res.data
}

// UPDATE: PUT /admin/theaters/{theaterId}/rooms/{roomId}
export async function updateRoom(theaterId: string, roomId: string, data: RoomUpdateDTO) {
  const res = await api.put(`/admin/theaters/${theaterId}/rooms/${roomId}`, data)
  return res.data
}
export async function updateSeat(theaterId: string, roomId: string, data: Seat[]) {
  const res = await api.put(`/admin/theaters/${theaterId}/rooms/${roomId}/seats`, data)
  return res.data
}
// DELETE: DELETE /admin/theaters/{theaterId}/rooms/{roomId}
export async function deleteRoom(theaterId: string, roomId: string) {
  const res = await api.delete(`/admin/theaters/${theaterId}/rooms/${roomId}`)
  return res.data
}

// --- Helper: Tạo SeatMap tự động ---
// Giúp tạo mảng ghế dựa trên số hàng/cột để gửi lên BE
export function generateSeatMap(rows: number, cols: number): Seat[] {
  const seats: Seat[] = []
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const rowLabel = rowLabels[r] || `R${r}`
      seats.push({
        seatNumber: `${rowLabel}${c}`,
        seatType: 'Thường', // Mặc định
        isAvailable: true,
        row: rowLabel,
        column: c,
      })
    }
  }
  return seats
}
