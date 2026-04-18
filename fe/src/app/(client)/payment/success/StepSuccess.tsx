import { Check, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BookingResponseData } from '@/types/booking'
import Image from 'next/image'
interface StepSuccessProps {
  bookingData: BookingResponseData | null
  onClose: () => void
}

export function StepSuccess({ bookingData, onClose }: StepSuccessProps) {
  const ticketCode = bookingData?.bookingCode || 'UNKNOWN'
  return (
    <div className="text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10 text-green-500" />
      </div>

      <h2 className="mb-3 text-text-primary text-2xl font-bold">Đặt vé thành công!</h2>
      <p className="text-text-secondary mb-10 max-w-md">
        Vé điện tử của bạn đã được gửi. Hãy xuất trình mã QR này khi vào rạp.
      </p>

      {/* QR Code Card */}
      <div className="max-w-sm w-full mb-8 transform hover:scale-105 transition-transform duration-300">
        <div className="bg-linear-to-br from-primary via-primary to-accent rounded-3xl p-8 shadow-[0_8px_32px_rgba(108,99,255,0.3)] relative overflow-hidden">
          {/* Decor blobs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-inner">
            <div className="aspect-square bg-white rounded-xl flex items-center justify-center border border-gray-100">
              {bookingData?.qrCode ? (
                <Image src={bookingData.qrCode} alt="QR Code" fill className="object-contain" />
              ) : (
                <QrCode className="w-full h-full p-2 text-gray-800" />
              )}
            </div>
          </div>

          <div className="text-white">
            <div className="text-sm mb-1 opacity-90 font-medium uppercase tracking-wider">
              Mã vé
            </div>
            <div className="tracking-widest font-mono text-2xl font-bold text-shadow-sm">
              #{ticketCode}
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={onClose}
        className="rounded-full px-10 h-12 bg-primary hover:bg-primary/90 text-white text-lg font-medium shadow-lg shadow-primary/25 transition-all hover:-translate-y-1"
      >
        Xem vé của tôi
      </Button>
    </div>
  )
}
