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
  Armchair,
  Hash,
  Loader2,
} from 'lucide-react'
import { Booking } from '@/types/booking'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCreateVNPayUrl, useCreateMoMoUrl } from '@/lib/api/payment'
import { toast } from 'sonner'

interface BookingDetailModalProps {
  booking: Booking | null
  onClose: () => void
}

export default function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  const router = useRouter()
  const { mutate: createVNPayPayment, isPending: isCreatingVNPay } = useCreateVNPayUrl()
  const { mutate: createMoMoPayment, isPending: isCreatingMoMo } = useCreateMoMoUrl()

  const isProcessing = isCreatingVNPay || isCreatingMoMo

  const handleRepay = () => {
    if (!booking) return
    const method = booking.paymentDetails?.paymentMethod
    
    const onSuccess = (res: any) => {
      const url = res.paymentUrl || res.payUrl || res.checkoutUrl || res.data?.payUrl
      if (url) window.location.href = url
      else toast.error('Không tìm thấy link thanh toán, vui lòng thử lại sau!')
    }

    if (method?.toLowerCase() === 'vnpay') {
      createVNPayPayment(booking._id, { onSuccess })
    } else if (method?.toLowerCase() === 'momo') {
      createMoMoPayment(booking._id, { onSuccess })
    } else {
      toast.info(`Phương thức thanh toán này (${method}) không hỗ trợ tiếp tục thanh toán trực tuyến.`)
      console.log("PAYMENT DETAILS:", booking.paymentDetails)
    }
  }
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (booking && booking.status === 'Chờ thanh toán') {
      intervalId = setInterval(() => {
        console.log('Đang check trạng thái vé ngầm...')
        router.refresh() 
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [booking?.status, !!booking, router])

  // Badge hiển thị trạng thái
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
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 animate-pulse">
            Chờ thanh toán
          </Badge>
        )
      case 'Đã hủy':
      case 'CANCELLED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Đã huỷ</Badge>
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
      <DialogContent className="rounded-xl max-w-2xl bg-surface border-border p-0 overflow-hidden shadow-2xl">
        {booking && (
          <>
            <DialogHeader className="p-6 pb-2 border-b border-border">
              <DialogTitle className="text-text-primary flex items-center gap-2 text-xl md:text-2xl">
                <Ticket className="w-6 h-6 text-primary" />
                Chi tiết vé
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Header: Ảnh phim & Giá tiền */}
              <div className="flex gap-4 md:gap-6">
                <div className="relative w-28 h-40 md:w-32 md:h-48 shrink-0 rounded-lg shadow-md overflow-hidden bg-gray-100 border border-border">
                  <Image
                    src={booking.schedule.movie.posterUrl || '/placeholder-movie.png'}
                    alt={booking.movieTitle || 'poster'}
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

                {/* QR Code Section: Tự nổ ra khi thanh toán thành công */}
                <div className="shrink-0 text-center hidden sm:block">
                  <div className="w-24 h-24 bg-white p-1 rounded-lg border border-border flex items-center justify-center mb-2 overflow-hidden relative shadow-sm">
                    {['Hoàn tất', 'COMPLETED', 'Đã sử dụng', 'USED'].includes(booking.status) ? (
                      booking.qrCode ? (
                        <Image src={booking.qrCode} alt="QR Code" fill className="object-contain" />
                      ) : (
                        <QrCode className="w-full h-full text-gray-300 p-2" />
                      )
                    ) : ['Đã hủy', 'CANCELLED'].includes(booking.status) ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded border border-red-100">
                        <span className="text-[10px] text-red-400 font-medium leading-tight text-center">
                          Vé đã <br /> bị hủy
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                        <span className="text-[10px] text-gray-400 font-medium leading-tight text-center">
                          Thanh toán <br /> để nhận mã
                        </span>
                      </div>
                    )}
                  </div>
                  {['Hoàn tất', 'COMPLETED', 'Đã sử dụng', 'USED'].includes(booking.status) ? (
                    <span className="text-xs text-text-secondary">Quét mã để vào rạp</span>
                  ) : ['Đã hủy', 'CANCELLED'].includes(booking.status) ? (
                    <span className="text-xs text-red-500 font-medium">Giao dịch đã huỷ</span>
                  ) : (
                    <Button 
                      onClick={handleRepay} 
                      disabled={isProcessing} 
                      size="sm" 
                      className="w-full mt-2 h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-full shadow-md shadow-primary/20"
                    >
                      {isProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Thanh toán ngay
                    </Button>
                  )}
                </div>
              </div>

              {/* Chi tiết suất chiếu */}
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
                  value={(booking.schedule.room as any)?.name || 'Phòng 1'}
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

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
  fullWidth?: boolean
}