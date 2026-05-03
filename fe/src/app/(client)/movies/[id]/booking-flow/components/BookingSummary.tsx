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
  total?: number 
  voucherInput: string
  setVoucherInput: (val: string) => void
  appliedVoucher: { code: string; discountAmount: number } | null
  voucherError: string
  isCheckingVoucher: boolean
  handleApplyVoucher: () => void
  handleClearVoucher: () => void
  subtotalAmount: number
  totalAmount: number
}

export function BookingSummary({
  movieTitle,
  selectedSchedule,
  selectedSeats,
  cartItems,
  voucherInput,
  setVoucherInput,
  appliedVoucher,
  voucherError,
  isCheckingVoucher,
  handleApplyVoucher,
  handleClearVoucher,
  subtotalAmount,
  totalAmount
}: BookingSummaryProps) {
  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + ' đ'

  const seatsTotal = selectedSeats.reduce((acc, seat) => {
    const isCouple = seat.seatType?.toLowerCase().includes('đôi') || seat.seatType?.toLowerCase().includes('couple');
    return acc + (isCouple ? seat.price / 2 : seat.price);
  }, 0);

  const combosTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const renderBadges = () => {
    const badges: string[] = [];
    const normalSeats = selectedSeats.filter(s => !(s.seatType?.toLowerCase().includes('đôi') || s.seatType?.toLowerCase().includes('couple')));
    const coupleSeats = selectedSeats.filter(s => s.seatType?.toLowerCase().includes('đôi') || s.seatType?.toLowerCase().includes('couple'));

    coupleSeats.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));

    normalSeats.forEach(s => badges.push(`${s.seatNumber} (${s.seatType})`));

    for (let i = 0; i < coupleSeats.length; i++) {
      const current = coupleSeats[i];
      const next = coupleSeats[i + 1];

      if (next && current.seatNumber.charAt(0) === next.seatNumber.charAt(0)) {
         const num1 = parseInt(current.seatNumber.slice(1));
         const num2 = parseInt(next.seatNumber.slice(1));
         if (num2 === num1 + 1) {
            badges.push(`${current.seatNumber.charAt(0)}${num1}-${num2} (Ghế đôi)`);
            i++; 
            continue;
         }
      }
      badges.push(`${current.seatNumber} (Ghế đôi)`);
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
                <span>{selectedSchedule.theater?.name} - {selectedSchedule.roomName}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {new Date(selectedSchedule.showDate).toLocaleDateString()}
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
              <Ticket className="w-4 h-4" /> Ghế ({renderBadges().length})
            </span>
            <span className="font-bold text-primary">
              {formatPrice(seatsTotal)}
            </span>
          </div>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {renderBadges().map((badgeTxt, idx) => (
                <Badge key={idx} variant="outline" className="bg-bg-secondary">
                  {badgeTxt}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary">Chưa chọn ghế</p>
          )}
        </div>

        {/* Bắp nước */}
        {cartItems.length > 0 && (
          <div className="space-y-3 mb-4 border-t border-border border-dashed pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-primary">Bắp nước</span>
              <span className="font-bold text-primary">{formatPrice(combosTotal)}</span>
            </div>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.quantity}x {item.product.name}</span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VOUCHER */}
        <div className="mt-4 pt-4 border-t border-dashed border-border">
          <p className="text-sm font-semibold text-text-primary mb-2">Mã Khuyến Mãi</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã voucher..."
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              disabled={appliedVoucher !== null}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase disabled:bg-bg-secondary disabled:text-text-secondary"
            />
            
            {appliedVoucher ? (
              <button 
                onClick={handleClearVoucher}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                Hủy
              </button>
            ) : (
              <button 
                onClick={handleApplyVoucher}
                disabled={!voucherInput || isCheckingVoucher}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isCheckingVoucher ? 'Đang check...' : 'Áp dụng'}
              </button>
            )}
          </div>

          {voucherError && (
            <p className="text-xs text-red-500 mt-2">{voucherError}</p>
          )}

          {appliedVoucher && (
            <div className="flex justify-between items-center mt-3 text-sm text-green-700 font-medium bg-green-50 p-2.5 rounded-lg border border-green-100">
              <span className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4" /> 
                Đã áp mã: {appliedVoucher.code}
              </span>
              <span>- {formatPrice(appliedVoucher.discountAmount)}</span>
            </div>
          )}
        </div>

        {/* TỔNG TIỀN (Hiển thị gạch ngang nếu có mã) */}
        <div className="pt-4 mt-4 border-t-2 border-border flex justify-between items-end">
          <span className="text-text-secondary font-medium">Tổng cộng</span>
          <div className="flex flex-col items-end">
            {appliedVoucher && (
              <span className="text-sm text-text-secondary line-through mb-0.5">
                {formatPrice(subtotalAmount)}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}