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

        {/* ============ KHU VỰC NHẬP VOUCHER (ĐÃ FIX UI) ============ */}
        <div className="mt-5 pt-5 border-t border-dashed border-border">
          <label className="text-sm font-bold text-text-primary mb-3 block">Mã Khuyến Mãi</label>
          <div className="flex items-stretch gap-2.5">
            <input
              type="text"
              placeholder="NHẬP MÃ VOUCHER..."
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              disabled={appliedVoucher !== null}
              className="flex-1 w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary uppercase transition-all bg-surface disabled:bg-bg-secondary disabled:text-text-secondary placeholder:text-gray-400"
            />
            
            {appliedVoucher ? (
              <button 
                onClick={handleClearVoucher}
                className="shrink-0 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all shadow-sm border border-red-100"
              >
                Hủy mã
              </button>
            ) : (
              <button 
                onClick={handleApplyVoucher}
                disabled={!voucherInput || isCheckingVoucher}
                className="shrink-0 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center min-w-[100px]"
              >
                {isCheckingVoucher ? 'Đang...' : 'Áp dụng'}
              </button>
            )}
          </div>

          {/* Báo lỗi UI mới */}
          {voucherError && (
            <p className="text-xs text-red-500 font-medium mt-2.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-red-500"></span> {voucherError}
            </p>
          )}

          {/* Báo thành công UI mới (Màu xanh ngọc xịn xò) */}
          {appliedVoucher && (
            <div className="flex justify-between items-center mt-3.5 text-sm text-emerald-700 font-bold bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 shadow-sm">
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4" /> 
                {appliedVoucher.code}
              </span>
              <span>- {formatPrice(appliedVoucher.discountAmount)}</span>
            </div>
          )}
        </div>

        {/* ============ DÒNG TỔNG CỘNG TÍNH TIỀN ============ */}
        <div className="pt-5 mt-5 border-t-2 border-border flex justify-between items-end">
          <span className="text-base text-text-secondary font-bold mb-1">Tổng cộng</span>
          <div className="flex flex-col items-end">
            {/* Hiển thị giá gốc bị gạch ngang (gạch màu đỏ mờ cho nổi bật) */}
            {appliedVoucher && (
              <span className="text-sm text-text-secondary line-through mb-1 decoration-red-400 decoration-2">
                {formatPrice(subtotalAmount)}
              </span>
            )}
            
            {/* Giá cuối cùng siêu to khổng lồ */}
            <span className="text-3xl font-black text-primary leading-none">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}