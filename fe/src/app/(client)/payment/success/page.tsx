'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useBookingDetail } from '@/lib/api/booking'
import { StepSuccess } from '@/app/(client)/payment/success/StepSuccess'
import { Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function PaymentResult() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // 1. BẮT PARAM CỦA VNPAY (Code cũ của fen)
  const vnpResponseCode = searchParams.get('vnp_ResponseCode')

  // 2. BẮT PARAM CỦA MOMO (Code mới t thêm vào)
  const momoResultCode = searchParams.get('resultCode')
  const momoExtraData = searchParams.get('extraData')

  // 3. XÁC ĐỊNH TRẠNG THÁI THÀNH CÔNG CHO CẢ 2 CỔNG
  const isVnpaySuccess = vnpResponseCode === '00'
  const isMomoSuccess = momoResultCode === '0'

  // Nếu có param trả về nhưng không phải mã thành công -> Báo lỗi
  const isFailed = (vnpResponseCode && !isVnpaySuccess) || (momoResultCode && !isMomoSuccess)

  // 4. LẤY BOOKING ID
  let bookingId = searchParams.get('bookingId') // Của VNPAY/PayOS

  // Nếu là MoMo, bóc vỏ extraData để lấy bookingId
  if (!bookingId && momoExtraData) {
    try {
      const decodedStr = atob(momoExtraData)
      const decodedData = JSON.parse(decodedStr)
      bookingId = decodedData.bookingId
    } catch (error) {
      console.error("Lỗi giải mã extraData MoMo:", error)
    }
  }

  // Fetch thông tin vé để hiển thị mã vé
  const { data: booking, isLoading } = useBookingDetail(bookingId || '')

  // GIAO DIỆN: THẤT BẠI
  if (isFailed) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-100 bg-red-50/50">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Thanh toán thất bại</h2>
          <p className="text-text-secondary mb-8">
            Giao dịch của bạn không thành công hoặc đã bị hủy. Vui lòng thử lại.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => router.push('/')}
            >
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // GIAO DIỆN: ĐANG TẢI THÔNG TIN
  if (isLoading || !booking) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-text-secondary">Đang xác thực giao dịch...</p>
      </div>
    )
  }

  // GIAO DIỆN: THÀNH CÔNG (DÙNG CHUNG CHO CẢ VNPAY VÀ MOMO)
  const bookingResponseData = {
    bookingId: booking._id,
    bookingCode: booking.bookingCode || booking._id.slice(-6).toUpperCase(),
    totalAmount: booking.totalAmount,
    qrCode: booking.qrCode,
    holdUntil: new Date(),
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-surface p-8 rounded-3xl shadow-xl border border-border">
        <StepSuccess
          bookingData={bookingResponseData}
          onClose={() => router.push('/order-history')}
        />
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <PaymentResult />
    </Suspense>
  )
}