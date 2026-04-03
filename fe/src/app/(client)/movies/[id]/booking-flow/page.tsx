'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  MonitorPlay,
  CreditCard,
  Armchair,
  Hash,
} from 'lucide-react'
import { Booking } from '@/types/booking'
import Image from 'next/image'

interface BookingDetailModalProps {
  booking: Booking | null
  onClose: () => void
}

export default function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  const router = useRouter()

  // TÍNH NĂNG 1: AUTO-REFRESH NGẦM KHI CHỜ THANH TOÁN
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (booking?.status === 'Chờ thanh toán') {
      intervalId = setInterval(() => {
        console.log('Đang hóng Webhook từ Server...')
        router.refresh() // Lệnh ma thuật Next.js: Tự load lại data ngầm
      }, 3000) // 3 giây check 1 lần
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [booking?.status, router])

  // Map status tiếng Việt sang Badge Style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hoàn tất':
      case 'COMPLETED':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
            Hoàn tất
          </Badge>
        )
      case 'Đã sử dụng':
      case 'USED':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            Đã xem
          </Badge>
        )
      case 'Chờ thanh toán':
      case 'PENDING_PAYMENT':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            Chờ thanh toán
          </Badge>
        )
      case 'Đã hủy':
      case 'CANCELLED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Đã huỷ</Badge>
        )
      case 'Hết hạn':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
            Hết hạn
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  return (
    <Dialog open={!!booking} onOpenChange={open => !open && onClose()}>
      <DialogContent className="rounded-xl max-w-2xl bg-surface border-border p-0 overflow-hidden">
        {booking && (
          <>
            <DialogHeader className="p-6 pb-2 border-b border-border">
              <DialogTitle className="text-text-primary flex items-center gap-2 text-xl md:text-2xl">
                <Ticket className="w-6 h-6 text-primary" />
                Chi tiết vé
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Movie Info Header */}
              <div className="flex gap-4 md:gap-6">
                <div className="relative w-28 h-40 md:w-32 md:h-48 shrink-0 rounded-lg shadow-md overflow-hidden bg-gray-100">
                  <Image
                    src={booking.schedule.movie.posterUrl || '/placeholder-movie.png'}
                    alt={booking.movieTitle || 'ảnh'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 112px, 128px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary mb-2 text-lg md:text-xl font-bold line-clamp-2">
                    {booking.movieTitle}
                  </h3>

                  <div className="mb-4">{getStatusBadge(booking.status)}</div>

                  <div className="text-primary font-bold text-2xl">
                    {formatPrice(booking.totalAmount)}
                  </div>
                </div>

                {/* 🚀 TÍNH NĂNG 2: QR CODE THÔNG MINH */}
                <div className="shrink-0 text-center hidden sm:block">
                  <div className="w-24 h-24 bg-white p-1 rounded-lg border border-border flex items-center justify-center mb-2 overflow-hidden relative">
                    {['Hoàn tất', 'COMPLETED', 'Đã sử dụng', 'USED'].includes(booking.status) ? (
                      booking.qrCode ? (
                        <Image src={booking.qrCode} alt="QR Code" fill className="object-contain" />
                      ) : (
                        <QrCode className="w-full h-full text-gray-300 p-2" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                        <span className="text-[10px] text-gray-400 font-medium leading-tight text-center mt-1">
                          Thanh toán <br /> để nhận mã
                        </span>
                      </div>
                    )}
                  </div>
                  {['Hoàn tất', 'COMPLETED', 'Đã sử dụng', 'USED'].includes(booking.status) ? (
                    <span className="text-xs text-text-secondary">Quét mã để vào rạp</span>
                  ) : (
                    <span className="text-xs text-yellow-600 font-medium animate-pulse">Đang chờ xử lý...</span>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-secondary/50 p-4 rounded-xl border border-border">
                <DetailItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Thời gian"
                  value={`${booking.schedule.startTime} - ${booking.schedule.endTime}`}
                />
                <DetailItem
                  icon={<MapPin className="w-4 h-4" />}
                  label="Rạp chiếu"
                  value={booking.schedule.theater.name}
                />
                <DetailItem
                  icon={<MonitorPlay className="w-4 h-4" />}
                  label="Phòng chiếu"
                  value={(booking.schedule.room as any)?.name || 'Đang cập nhật'}
                />
                <DetailItem
                  icon={<Armchair className="w-4 h-4" />}
                  label="Ghế ngồi"
                  value={booking.seats.map(s => s.seatNumber).join(', ')}
                  className="text-primary font-bold"
                />

                <DetailItem
                  icon={<Hash className="w-4 h-4" />}
                  label="Mã đặt vé"
                  value={booking.bookingCode || booking._id}
                  fullWidth
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Helper component nhỏ để render từng dòng chi tiết cho gọn
interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
  fullWidth?: boolean
}

function DetailItem({ icon, label, value, className = '', fullWidth = false }: DetailItemProps) {
  return (
    <div className={`${fullWidth ? 'sm:col-span-2' : ''} flex items-start gap-3`}>
      <div className="mt-0.5 text-text-secondary">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-text-secondary mb-0.5">{label}</p>
        <p className={`text-sm text-text-primary font-medium wrap-break-word ${className}`}>
          {value}
        </p>
      </div>
    </div>
  )
}