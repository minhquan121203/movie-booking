import type { Schedule, SeatAvailability } from '@/types/schedule'
import type { BookedSeat } from '@/types/booking'
import type { Seat } from '@/types/theater'
import { useMemo, useState } from 'react'

interface SeatMapsProps {
  selectedSeats: BookedSeat[]
  schedule: Schedule | null
  onSeatClick: (seat: Seat) => void
  realTimeSeats?: Map<string, Seat>
  isSeatAvailable?: (seat: Seat) => boolean
}

// 🚀 Khai báo thêm Type mở rộng để phục vụ việc Gom ghế đôi
interface MergedSeat extends SeatAvailability {
  isMergedPair?: boolean
  pairedSeat?: SeatAvailability
  displayNumber?: string
}

const time = Date.now()

export function SeatMaps({
  selectedSeats,
  schedule,
  onSeatClick,
  realTimeSeats,
  isSeatAvailable,
}: SeatMapsProps) {
  const [currentTime] = useState(time)

  // 1. Xử lý dữ liệu: Gom nhóm ghế theo Hàng và GỘP GHẾ ĐÔI
  const rows = useMemo(() => {
    if (!schedule?.seatAvailability) return []

    const groups: Record<string, SeatAvailability[]> = {}

    schedule.seatAvailability.forEach(seat => {
      const rowLabel = seat.seatNumber.charAt(0)
      if (!groups[rowLabel]) {
        groups[rowLabel] = []
      }
      groups[rowLabel].push(seat)
    })

    return Object.keys(groups)
      .sort()
      .map(rowLabel => {
        // Sắp xếp ghế theo số thứ tự
        const sortedSeats = groups[rowLabel].sort((a, b) => {
          const numA = parseInt(a.seatNumber.slice(1))
          const numB = parseInt(b.seatNumber.slice(1))
          return numA - numB
        })

        const mergedSeats: MergedSeat[] = []
        
        // 🚀 THUẬT TOÁN GOM GHẾ ĐÔI (SOFA)
        for (let i = 0; i < sortedSeats.length; i++) {
          const currentSeat = sortedSeats[i]
          const nextSeat = sortedSeats[i + 1]

          // Nếu ghế hiện tại và ghế kế tiếp ĐỀU LÀ GHẾ ĐÔI -> Gom thành 1 cặp
          if (currentSeat.seatType === 'Ghế đôi' && nextSeat && nextSeat.seatType === 'Ghế đôi') {
            mergedSeats.push({
              ...currentSeat,
              isMergedPair: true,
              pairedSeat: nextSeat, // Lưu lại dữ liệu của thằng ghế anh em
              displayNumber: `${currentSeat.seatNumber.slice(1)}-${nextSeat.seatNumber.slice(1)}` // Hiển thị: 3-4
            })
            i++ // Nhảy cóc qua ghế tiếp theo vì đã bị gộp vào rồi
          } else {
            // Ghế thường, VIP, hoặc ghế đôi bị lẻ thì giữ nguyên
            mergedSeats.push({
              ...currentSeat,
              isMergedPair: false,
              displayNumber: currentSeat.seatNumber.slice(1)
            })
          }
        }

        return {
          rowLabel,
          seats: mergedSeats,
        }
      })
  }, [schedule, realTimeSeats])

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

  // 3. Trạng thái của ghế (cập nhật để check cả 2 ghế trong 1 Sofa)
  const getSeatStatus = (seat: MergedSeat) => {
    const realTimeSeat1 = realTimeSeats?.get(seat.seatNumber)
    const realTimeSeat2 = seat.pairedSeat ? realTimeSeats?.get(seat.pairedSeat.seatNumber) : null

    // Bất kỳ ghế nào trong cặp bị Booked -> Cả Sofa màu Xám
    if (seat.isBooked || realTimeSeat1?.isBooked || seat.pairedSeat?.isBooked || realTimeSeat2?.isBooked) {
      return 'booked'
    }

    const isSelected1 = selectedSeats.some(s => s.seatNumber === seat.seatNumber)
    const isSelected2 = seat.pairedSeat ? selectedSeats.some(s => s.seatNumber === seat.pairedSeat?.seatNumber) : false

    // Bất kỳ ghế nào trong cặp đang được chọn -> Cả Sofa màu Xanh (Selected)
    if (isSelected1 || isSelected2) return 'selected'

    const isHeld = realTimeSeat1?.holdUntil || realTimeSeat2?.holdUntil
    if (isHeld) return 'held'

    return seat.seatType === 'VIP' ? 'vip' : seat.seatType === 'Ghế đôi' ? 'couple' : 'standard'
  }

  const canClickSeat = (seat: MergedSeat) => {
    const status = getSeatStatus(seat)
    if (status === 'booked' || status === 'held') return false

    if (isSeatAvailable) {
      const avail1 = isSeatAvailable(seat as unknown as Seat)
      const avail2 = seat.pairedSeat ? isSeatAvailable(seat.pairedSeat as unknown as Seat) : true
      return avail1 && avail2
    }
    return true
  }

  // 🚀 Khi click vào Sofa, chọn luôn CẢ 2 GHẾ
  const handleSeatClick = (seat: MergedSeat) => {
    onSeatClick(seat as unknown as Seat) // Chọn ghế trái
    if (seat.isMergedPair && seat.pairedSeat) {
      onSeatClick(seat.pairedSeat as unknown as Seat) // Chọn nốt ghế phải
    }
  }

  return (
    <>
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm overflow-x-auto">
        <div className="flex flex-col items-center min-w-max gap-3">
          {rows.map(({ rowLabel, seats }) => (
            <div key={rowLabel} className="flex items-center gap-2 sm:gap-4">
              <span className="w-6 text-text-secondary text-center font-bold text-sm">
                {rowLabel}
              </span>

              <div className="flex items-center gap-2">
                {seats.map(seat => {
                  const status = getSeatStatus(seat)
                  const price = getSeatPrice(seat.seatType)
                  const isCouple = seat.seatType === 'Ghế đôi'
                  const canClick = canClickSeat(seat)

                  return (
                    <button
                      key={seat.seatNumber}
                      disabled={!canClick}
                      onClick={() => canClick && handleSeatClick(seat)}
                      className={`
                        relative group transition-all duration-200 flex items-center justify-center border
                        ${isCouple ? 'w-20 sm:w-28 h-8 sm:h-10 rounded-xl' : 'w-8 h-8 sm:w-10 sm:h-10 rounded-lg'}
                        
                        ${
                          status === 'selected'
                            ? 'bg-primary text-white border-primary shadow-lg scale-105 z-10'
                            : status === 'booked'
                              ? 'bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-60'
                              : status === 'held'
                                ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50 opacity-80 animate-pulse'
                                : status === 'vip'
                                  ? 'bg-orange-500/10 text-orange-600 border-orange-500/40 hover:bg-orange-500/20 hover:scale-105'
                                  : status === 'couple'
                                    ? 'bg-pink-500/10 text-pink-600 border-pink-500/40 hover:bg-pink-500/20 hover:scale-105'
                                    : 'bg-bg-secondary text-text-primary border-border hover:border-primary hover:bg-primary/5 hover:scale-105'
                        }
                      `}
                    >
                      <span className="text-[10px] sm:text-xs font-medium">
                        {seat.displayNumber}
                      </span>

                      {canClick && status !== 'booked' && status !== 'held' && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                          <div className="font-bold">{seat.seatType}</div>
                          <div>{price.toLocaleString()}đ</div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      )}

                      {status === 'booked' && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-[10px] py-1.5 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                          <div className="font-bold">Đã đặt</div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-600 rotate-45"></div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend giữ nguyên */}
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
            <div className="w-12 h-5 rounded bg-pink-500/10 border border-pink-500/30"></div>
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