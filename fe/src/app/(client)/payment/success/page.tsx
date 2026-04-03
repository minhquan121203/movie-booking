'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function PaymentProcessor() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('Đang xử lý giao dịch. Vui lòng không đóng trang...')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!searchParams) return;

    const processPayment = async () => {
      const vnpResponseCode = searchParams.get('vnp_ResponseCode')
      const vnpTxnRef = searchParams.get('vnp_TxnRef')

      const momoResultCode = searchParams.get('resultCode')
      const momoOrderId = searchParams.get('orderId')
      const momoExtraData = searchParams.get('extraData')

      const isVnpaySuccess = vnpResponseCode === '00'
      const isMomoSuccess = momoResultCode === '0'

      if (!vnpResponseCode && !momoResultCode) {
        return router.push('/order-history')
      }

      if (!isVnpaySuccess && !isMomoSuccess) {
        setIsError(true)
        setStatus('Giao dịch chưa hoàn tất hoặc đã bị hủy. Về trang chủ...')
        setTimeout(() => router.push('/'), 2500)
        return
      }

      let bookingId = searchParams.get('bookingId')
      let paymentMethod = ''
      let transactionId = ''

      if (isMomoSuccess) {
        paymentMethod = 'MoMo'
        transactionId = momoOrderId || ''
        if (momoExtraData) {
          try {
            const safeBase64 = momoExtraData.replace(/ /g, '+')
            const decodedData = JSON.parse(atob(safeBase64))
            bookingId = decodedData.bookingId
          } catch (e) {
            console.error("Lỗi giải mã MoMo ExtraData:", e)
          }
        }
      } else if (isVnpaySuccess) {
        paymentMethod = 'VNPAY'
        transactionId = vnpTxnRef || ''
      }

      if (!bookingId) {
        setIsError(true)
        setStatus('Không tìm thấy mã đơn hàng! Đang về lịch sử vé...')
        setTimeout(() => router.push('/order-history'), 2500)
        return
      }

      setStatus('Thanh toán thành công! Hệ thống đang sinh mã vé QR...')
        
      setTimeout(() => {
         router.push('/order-history')
      }, 3000)
    }

    processPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-surface p-8 rounded-2xl border border-border max-w-md w-full shadow-xl">
        {isError ? (
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        ) : (
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
        )}
        <h2 className="text-2xl font-bold text-text-primary mb-3">
          {isError ? 'Có lỗi xảy ra!' : 'Đang xử lý'}
        </h2>
        <p className={`font-medium ${isError ? 'text-red-400' : 'text-text-secondary animate-pulse'}`}>
          {status}
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <PaymentProcessor />
    </Suspense>
  )
}