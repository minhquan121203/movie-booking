import type { Schedule, SeatAvailability } from '@/types/schedule'
import type { BookedSeat } from '@/types/booking'
import type { Seat } from '@/types/theater'
import { useMemo } from 'react'

interface SeatMapsProps {
  selectedSeats: BookedSeat[]
  schedule: Schedule | null
  onSeatClick: (seat: Seat) => void
}

export function SeatMaps({ selectedSeats, schedule, onSeatClick }: SeatMapsProps) {
  // 1. Xử lý dữ liệu: Gom nhóm theo Hàng và GỘP GHẾ ĐÔI
  const rows = useMemo(() => {
    if (!schedule?.seatAvailability) return []

    const groups: Record<string, SeatAvailability[]> = {}

    schedule.seatAvailability.forEach(seat => {
      const rowLabel = seat.seatNumber.charAt(0) // Lấy ký tự đầu làm tên hàng (A, B, C...)
      if (!groups[rowLabel]) {
        groups[rowLabel] = []
      }
      groups[rowLabel].push(seat)
    })

    // Sắp xếp các hàng theo thứ tự A -> Z
    return Object.keys(groups)
      .sort()
      .map(rowLabel => {
        const sortedSeats = groups[rowLabel].sort((a, b) => {
          // Sắp xếp ghế trong hàng theo số (A1 -> A2 -> A10)
          const numA = parseInt(a.seatNumber.slice(1))
          const numB = parseInt(b.seatNumber.slice(1))
          return numA - numB
        })

        // 🔥 THUẬT TOÁN "DÒ MÌN": Gộp 2 ghế đôi kề nhau thành 1
        const mergedSeats = []
        for (let i = 0; i < sortedSeats.length; i++) {
          const current = sortedSeats[i]
          
          if (
            current.seatType === 'Ghế đôi' && 
            i < sortedSeats.length - 1 && 
            sortedSeats[i+1].seatType === 'Ghế đôi'
          ) {
            const next = sortedSeats[i+1]
            mergedSeats.push({
              isMerged: true,
              primary: current,
              secondary: next,
              displayNumber: `${current.seatNumber.slice(1)}-${next.seatNumber.slice(1)}`, // Tạo tên K1-2
              seatType: 'Ghế đôi'
            })
            i++ // Bỏ qua ghế tiếp theo vì đã bị nuốt vào rồi
          } else {
            mergedSeats.push({
              isMerged: false,
              primary: current,
              secondary: null,
              displayNumber: current.seatNumber.slice(1),
              seatType: current.seatType
            })
          }
        }

        return { rowLabel, seats: mergedSeats }
      })
  }, [schedule])

  // 2. Hàm lấy giá vé (chỉ để hiển thị tooltip)
  const getSeatPrice = (seatType: string) => {
    if (!schedule?.ticketPrices) return 0
    switch (seatType) {
      case 'VIP':
        return schedule.ticketPrices.vip || schedule.ticketPrices.standard + 20000
      case 'Ghế đôi':
        return schedule.ticketPrices.couple || schedule.ticketPrices.standard * 2
      case 'Thường':
      default:
        return schedule.ticketPrices.standard
    }
  }

  return (
    <>
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm overflow-x-auto">
        <div className="flex flex-col items-center min-w-max gap-3">
          {rows.map(({ rowLabel, seats }) => (
            <div key={rowLabel} className="flex items-center gap-2 sm:gap-4">
              {/* Tên hàng */}
              <span className="w-6 text-text-secondary text-center font-bold text-sm">
                {rowLabel}
              </span>

              {/* Danh sách ghế */}
              <div className="flex items-center gap-2">
                {seats.map(seatInfo => {
                  const { isMerged, primary, secondary, displayNumber, seatType } = seatInfo
                  
                  // 🔥 TRẠNG THÁI GỘP: Chỉ cần 1 ghế đã đặt hoặc đang chọn là cả cặp bị ảnh hưởng
                  const isBooked = primary.isBooked || (secondary && secondary.isBooked)
                  const isSelected = selectedSeats.some(s => s.seatNumber === primary.seatNumber) ||
                                     (secondary && selectedSeats.some(s => s.seatNumber === secondary.seatNumber))

                  const status = isBooked ? 'booked'
                               : isSelected ? 'selected'
                               : seatType === 'VIP' ? 'vip'
                               : seatType === 'Ghế đôi' ? 'couple'
                               : 'standard'

                  const price = getSeatPrice(seatType)

                  return (
                    <button
                      key={primary.seatNumber}
                      disabled={status === 'booked'}
                      onClick={() => {
                        // Gọi click cho ghế chính
                        onSeatClick(primary as unknown as Seat)
                        // Nếu là ghế đôi, tự động click nốt ghế phụ cho vào giỏ hàng
                        if (isMerged && secondary) {
                          setTimeout(() => onSeatClick(secondary as unknown as Seat), 10)
                        }
                      }}
                      className={`
                        relative group transition-all duration-200 flex items-center justify-center border
                        ${isMerged ? 'w-20 sm:w-24 h-8 sm:h-10 rounded-xl' : 'w-8 h-8 sm:w-10 sm:h-10 rounded-lg'}
                        
                        ${
                          status === 'selected'
                            ? 'bg-primary text-white border-primary shadow-lg scale-105 z-10'
                            : status === 'booked'
                              ? 'bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-60'
                              : status === 'vip'
                                ? 'bg-orange-500/10 text-orange-600 border-orange-500/40 hover:bg-orange-500/20'
                                : status === 'couple'
                                  ? 'bg-pink-500/10 text-pink-600 border-pink-500/40 hover:bg-pink-500/20'
                                  : 'bg-bg-secondary text-text-primary border-border hover:border-primary hover:bg-primary/5'
                        }
                      `}
                    >
                      <span className="text-[10px] sm:text-xs font-medium">
                        {displayNumber}
                      </span>

                      {/* Tooltip */}
                      {status !== 'booked' && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                          <div className="font-bold">{seatType}</div>
                          <div>{price.toLocaleString()}đ {isMerged && '(cả cặp)'}</div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-10 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-bg-secondary border border-border"></div>
            <span className="text-sm text-text-secondary">Thường</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500/10 border border-orange-500/30"></div>
            <span className="text-sm text-text-secondary">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Tớ làm cái icon legend ghế đôi dài ra xíu cho nó trực quan */}
            <div className="w-10 h-5 rounded bg-pink-500/10 border border-pink-500/30"></div>
            <span className="text-sm text-text-secondary">Ghế đôi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary border border-primary"></div>
            <span className="text-sm text-text-secondary">Đang chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-muted opacity-60"></div>
            <span className="text-sm text-text-secondary">Đã đặt</span>
          </div>
        </div>
      </div>
    </>
  )
}