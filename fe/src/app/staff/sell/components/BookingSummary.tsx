'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Banknote, QrCode, Printer, Loader2 } from 'lucide-react'
import { Schedule } from '@/types/schedule'
import { BookedSeat } from '@/types/booking'

interface BookingSummaryProps {
  selectedSchedule: Schedule | null
  selectedSeats: BookedSeat[]
  totalAmount: number
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onPayment: () => void
  isProcessing: boolean
}

export function BookingSummary({
  selectedSchedule,
  selectedSeats,
  totalAmount,
  paymentMethod,
  setPaymentMethod,
  onPayment,
  isProcessing,
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
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Suất</p>
            <Badge variant="outline" className="font-mono text-xs">
              {selectedSchedule ? selectedSchedule.startTime : '--:--'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phòng</p>
            <p className="text-sm">{selectedSchedule?.room.roomName || '--'}</p>
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
            className="w-full border-primary text-primary hover:bg-primary/5"
            disabled={selectedSeats.length === 0}
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
      </div>
    </Card>
  )
}
