import { MapPin, Clock, Calendar, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CartItem } from '@/types'
import { BookedSeat } from '@/types/booking'
import { Schedule } from '@/types/schedule'

interface BookingSummaryProps {
  movieTitle: string
  selectedSchedule: Schedule | null
  selectedSeats: BookedSeat[]
  cartItems: CartItem[]
  total: number
}

export function BookingSummary({
  movieTitle,
  selectedSchedule,
  selectedSeats,
  cartItems,
  total,
}: BookingSummaryProps) {
  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + ' đ'

  // 1. CHIA ĐÔI TIỀN GHẾ COUPLE
  const seatsTotal = selectedSeats.reduce((acc, seat) => {
    const isCouple = seat.seatType?.toLowerCase().includes('đôi') || seat.seatType?.toLowerCase().includes('couple');
    return acc + (isCouple ? seat.price / 2 : seat.price);
  }, 0);

  const combosTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const displayTotal = seatsTotal + combosTotal;

  // 2. LOGIC GỘP CHỮ "K9" VÀ "K10" THÀNH "K9-10"
  const renderBadges = () => {
    const badges: string[] = [];
    const coupleSeats = selectedSeats.filter(s => s.seatType?.toLowerCase().includes('đôi') || s.seatType?.toLowerCase().includes('couple'));
    const normalSeats = selectedSeats.filter(s => !(s.seatType?.toLowerCase().includes('đôi') || s.seatType?.toLowerCase().includes('couple')));

    // Ghế thường thì cứ hiện bình thường
    normalSeats.forEach(s => badges.push(`${s.seatNumber} (${s.seatType})`));

    // Ghế đôi thì gom 2 cái liền nhau lại
    for (let i = 0; i < coupleSeats.length; i += 2) {
      if (coupleSeats[i + 1]) {
        const first = coupleSeats[i].seatNumber; // VD: K9
        const secondNum = coupleSeats[i + 1].seatNumber.replace(/[^0-9]/g, ''); // VD: 10
        badges.push(`${first}-${secondNum} (Ghế đôi)`);
      } else {
        // Trường hợp bị lẻ do bug click
        badges.push(`${coupleSeats[i].seatNumber} (Đang lỗi click)`);
      }
    }
    return badges;
  }

  return (
    <div className="w-full lg:w-[380px] flex-shrink-0">
      <div className="bg-surface rounded-2xl p-6 border border-border sticky top-24 shadow-lg">
        <div className="pb-4 mb-4 border-b border-border border-dashed">
          <h3 className="text-xl font-bold text-text-primary mb-2">{movieTitle}</h3>
          {selectedSchedule ? (
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                {/* Truy cập nested object theater */}
                <span>
                  {selectedSchedule.theater?.name} - {selectedSchedule.roomName}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />{' '}
                  {new Date(selectedSchedule.showDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {selectedSchedule.startTime}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-secondary italic">Vui lòng chọn suất chiếu</div>
          )}
        </div>

        {/* Danh sách ghế */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text-primary flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Ghế ({selectedSeats.length})
            </span>
            <span className="font-bold text-primary">
              {formatPrice(selectedSeats.reduce((acc, s) => acc + s.price, 0))}
            </span>
          </div>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedSeats.map(seat => (
                <Badge key={seat.seatNumber} variant="outline" className="bg-bg-secondary">
                  {seat.seatNumber} ({seat.seatType})
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary">Chưa chọn ghế</p>
          )}
        </div>

        {/* Danh sách Combo */}
        {cartItems.length > 0 && (
          <div className="space-y-3 mb-4 border-t border-border border-dashed pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-primary">Bắp nước</span>
              <span className="font-bold text-primary">
                {formatPrice(
                  cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
                )}
              </span>
            </div>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tổng tiền */}
        <div className="pt-4 border-t-2 border-border flex justify-between items-end">
          <span className="text-text-secondary font-medium">Tổng cộng</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(displayTotal)}</span>
        </div>
      </div>
    </div>
  )
}
