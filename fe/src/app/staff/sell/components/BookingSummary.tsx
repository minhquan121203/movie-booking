'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Banknote, QrCode, Printer, Loader2 } from 'lucide-react'
import { Schedule } from '@/types/schedule'
import { BookedSeat } from '@/types/booking'
import type { CartProduct } from './ProductSelector'

interface BookingSummaryProps {
  selectedSchedule: Schedule | null
  selectedSeats: BookedSeat[]
  totalAmount: number
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onPayment: () => void
  isProcessing: boolean
  lastBooking?: any
  productCart?: CartProduct[]
  onPrintDone?: () => void // Callback sau khi in xong → reset về form khách mới
}

// Hàm mở cửa sổ in vé
function printTicket(booking: any, schedule: Schedule | null, productCart: CartProduct[] = []) {
  if (!booking) return

  const bookingData = booking.booking || booking
  const seats = bookingData.seats?.map((s: any) => s.seatNumber).join(', ') || '---'
  const qrCode = bookingData.qrCode || ''
  const movieTitle = bookingData.movieTitle || schedule?.movie?.title || '---'
  const theaterName = bookingData.theaterName || '---'
  const roomName = bookingData.roomName || schedule?.roomName || '---'
  const showDate = bookingData.showDate
    ? new Date(bookingData.showDate).toLocaleDateString('vi-VN')
    : '---'
  const showTime = bookingData.showTime || `${schedule?.startTime || ''}`
  const bookingCode = bookingData.bookingCode || '---'
  const totalAmount = (bookingData.totalAmount || 0).toLocaleString('vi-VN')
  const paymentMethod = bookingData.paymentDetails?.paymentMethod || 'Tại quầy'
  const customerName = bookingData.guestCustomer?.name || '---'

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Ve Xem Phim - ${bookingCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .ticket {
      background: white;
      width: 380px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .ticket-header {
      background: linear-gradient(135deg, #6c63ff, #a855f7);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .cinema-name { font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
    .cinema-sub { font-size: 11px; opacity: 0.8; }
    .ticket-body { padding: 20px; }
    .movie-title {
      font-size: 17px;
      font-weight: 800;
      color: #1a1a2e;
      text-align: center;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .info-item label {
      font-size: 9px; color: #888; text-transform: uppercase;
      font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 3px;
    }
    .info-item span { font-size: 13px; font-weight: 700; color: #1a1a2e; }
    .info-item.full { grid-column: 1 / -1; }
    .seats-box {
      background: #f8f5ff; border: 1.5px dashed #a855f7;
      border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 16px;
    }
    .seats-box label { font-size: 9px; color: #888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; }
    .seats-box span { font-size: 18px; font-weight: 900; color: #6c63ff; letter-spacing: 1px; }
    .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 16px 0; }
    .qr-section { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
    .qr-section img { width: 150px; height: 150px; border: 3px solid #6c63ff; border-radius: 12px; padding: 4px; }
    .qr-placeholder {
      width: 150px; height: 150px; background: #f0f0f0; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 12px;
    }
    .booking-code {
      font-size: 11px; font-weight: 700; color: #555; letter-spacing: 2px;
      background: #f0f0f0; padding: 4px 12px; border-radius: 20px;
    }
    .total-row {
      display: flex; justify-content: space-between; align-items: center;
      background: #1a1a2e; color: white; padding: 12px 16px; border-radius: 10px; margin-bottom: 12px;
    }
    .total-row .label { font-size: 12px; opacity: 0.8; }
    .total-row .amount { font-size: 18px; font-weight: 900; }
    .footer-note { text-align: center; font-size: 10px; color: #aaa; line-height: 1.6; }
    /* Bắp nước */
    .products-box {
      background: #fff8f0; border: 1.5px dashed #f59e0b;
      border-radius: 10px; padding: 12px; margin-bottom: 16px;
    }
    .products-box .p-title { font-size: 9px; color: #888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 8px; }
    .products-box .p-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .products-box .p-row .p-name { color: #374151; }
    .products-box .p-row .p-price { font-weight: 700; color: #d97706; }
    @media print {
      body { background: white; padding: 0; }
      .ticket { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <div class="cinema-name">CineBooking</div>
      <div class="cinema-sub">Ve dien tu / E-Ticket</div>
    </div>
    <div class="ticket-body">
      <div class="movie-title">${movieTitle}</div>
      <div class="info-grid">
        <div class="info-item">
          <label>Rap chieu</label>
          <span>${theaterName}</span>
        </div>
        <div class="info-item">
          <label>Phong</label>
          <span>${roomName}</span>
        </div>
        <div class="info-item">
          <label>Ngay chieu</label>
          <span>${showDate}</span>
        </div>
        <div class="info-item">
          <label>Suat chieu</label>
          <span>${showTime}</span>
        </div>
        <div class="info-item full">
          <label>Khach hang</label>
          <span>${customerName}</span>
        </div>
        <div class="info-item full">
          <label>Thanh toan</label>
          <span>${paymentMethod}</span>
        </div>
      </div>
      <div class="seats-box">
        <label>Ghe ngoi</label>
        <span>${seats}</span>
      </div>
      ${productCart.length > 0 ? `
      <div class="products-box">
        <span class="p-title">Bap nuoc / Do an kem theo</span>
        ${productCart.map(p => `
        <div class="p-row">
          <span class="p-name">${p.name}${p.size && p.size !== 'N/A' ? ` (${p.size})` : ''} x${p.quantity}</span>
          <span class="p-price">${(p.price * p.quantity).toLocaleString('vi-VN')}d</span>
        </div>`).join('')}
      </div>` : ''}
      <hr class="divider" />
      <div class="qr-section">
        ${qrCode
          ? `<img src="${qrCode}" alt="QR Code" />`
          : `<div class="qr-placeholder">Khong co QR</div>`}
        <div class="booking-code">${bookingCode}</div>
      </div>
      <div class="total-row">
        <span class="label">Tong tien</span>
        <span class="amount">${totalAmount} d</span>
      </div>
      <div class="footer-note">
        Vui long xuat trinh ve nay khi vao rap.<br/>
        Ve da mua khong duoc hoan tra. Cam on ban!
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=460,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

export function BookingSummary({
  selectedSchedule,
  selectedSeats,
  totalAmount,
  paymentMethod,
  setPaymentMethod,
  onPayment,
  isProcessing,
  lastBooking,
  productCart = [],
  onPrintDone,
}: BookingSummaryProps) {
  return (
    <Card className="p-5 border border-gray-200 shadow-md h-full flex flex-col sticky top-0">
      <h3 className="font-bold text-lg text-gray-900 mb-4 pb-3 border-b border-gray-100">
        Chi Tiết Đơn Hàng
      </h3>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Phim */}
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phim</p>
          <p className="font-medium text-gray-900 text-sm">
            {selectedSchedule ? selectedSchedule.movie.title : '---'}
          </p>
        </div>

        {/* Suất */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibond mb-1">Suất</p>
            <Badge variant="outline" className="font-mono text-xs">
              {selectedSchedule ? selectedSchedule.startTime : '--:--'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phòng</p>
            <p className="text-sm">{selectedSchedule?.room?.roomName || '--'}</p>
          </div>
        </div>

        {/* Ghế */}
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
            Ghế đã chọn ({selectedSeats.length})
          </p>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedSeats.map(seat => (
                <Badge
                  key={seat.seatNumber}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 text-xs px-1.5"
                >
                  {seat.seatNumber}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Chưa chọn ghế</p>
          )}
        </div>

        {/* Bắp nước */}
        {productCart.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Bắp nước ({productCart.length} loại)
            </p>
            <div className="space-y-1">
              {productCart.map(p => (
                <div key={p.productId} className="flex justify-between items-center text-xs">
                  <span className="text-gray-700">{p.name} ×{p.quantity}</span>
                  <span className="font-medium text-amber-600">{(p.price * p.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Thanh Toán */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600 font-medium text-sm">Tổng tiền</span>
          <span className="text-xl font-bold text-primary">
            {totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Thanh toán qua</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Banknote className="w-4 h-4" /> Tiền mặt
            </button>
            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'bank_transfer'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <QrCode className="w-4 h-4" /> Chuyển khoản
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`w-full transition-all ${
              lastBooking
                ? 'border-green-500 text-green-600 hover:bg-green-50'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!lastBooking}
            onClick={() => {
              printTicket(lastBooking, selectedSchedule, productCart)
              // Reset về form khách mới sau khi in
              setTimeout(() => {
                onPrintDone?.()
              }, 500)
            }}
            title={!lastBooking ? 'Thanh toán xong mới in được' : 'Mở cửa sổ in vé'}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> In Vé
          </Button>
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={onPayment}
            disabled={isProcessing || selectedSeats.length === 0}
          >
            {isProcessing ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : 'Thanh Toán'}
          </Button>
        </div>

        {lastBooking ? (
          <p className="text-[10px] text-green-600 text-center mt-2 font-medium">
            ✅ Đơn hàng đã tạo — nhấn In Vé để in
          </p>
        ) : selectedSeats.length > 0 ? (
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Thanh toán xong để kích hoạt In Vé
          </p>
        ) : null}
      </div>
    </Card>
  )
}
