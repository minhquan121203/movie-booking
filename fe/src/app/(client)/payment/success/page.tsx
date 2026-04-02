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
      // 1. ĐỌC THAM SỐ TỪ VNPAY / MOMO
      const vnpResponseCode = searchParams.get('vnp_ResponseCode')
      const vnpTxnRef = searchParams.get('vnp_TxnRef')

      const momoResultCode = searchParams.get('resultCode')
      const momoOrderId = searchParams.get('orderId')
      const momoExtraData = searchParams.get('extraData')

      const isVnpaySuccess = vnpResponseCode === '00'
      const isMomoSuccess = momoResultCode === '0'

      // Nếu không có tham số gì cả (user tự gõ link) -> Về lịch sử vé
      if (!vnpResponseCode && !momoResultCode) {
        return router.push('/order-history')
      }

      // Nếu giao dịch thất bại từ ví -> Về trang chủ
      if (!isVnpaySuccess && !isMomoSuccess) {
        setIsError(true)
        setStatus('Giao dịch chưa hoàn tất hoặc đã bị hủy. Về trang chủ...')
        setTimeout(() => router.push('/'), 2500)
        return
      }

      // 2. KHUI BOOKING ID VÀ CHUẨN BỊ DATA
      let bookingId = searchParams.get('bookingId')
      let paymentMethod = ''
      let transactionId = ''

      if (isMomoSuccess) {
        paymentMethod = 'MoMo'
        transactionId = momoOrderId || ''
        if (momoExtraData) {
          try {
            // Fix lỗi Base64 bị mất dấu '+' khi truyền qua URL
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

      // 3. GỌI API CHỐT ĐƠN (CÓ KẸP TOKEN ĐĂNG NHẬP)
      try {
        setStatus('Đang xác nhận thanh toán & sinh mã vé QR...')
        
        // Lấy token đăng nhập từ LocalStorage (Tùy project fen lưu tên là gì, t bắt cả 2)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

        await axios.post(
          `https://movie-booking-api-bcfe.onrender.com/api/bookings/${bookingId}/confirm`, 
          {
            paymentMethod: paymentMethod,
            transactionId: transactionId
          },
          {
            headers: {
              Authorization: `Bearer ${token}` // <--- ĐIỂM CHÍ MẠNG Ở ĐÂY!
            }
          }
        )
        
        setStatus('Thành công! Đang tự động chuyển đến Lịch sử vé...')
        setTimeout(() => router.push('/order-history'), 1000)

      } catch (error: any) {
        console.error('Lỗi duyệt đơn:', error)
        setIsError(true)
        // Hiển thị rõ lỗi từ Backend trả về để dễ fix
        setStatus(`Lỗi duyệt vé: ${error.response?.data?.message || 'Không thể kết nối Server'}. Về lịch sử vé...`)
        setTimeout(() => router.push('/order-history'), 4000)
      }
    }

    processPayment()
  }, [searchParams, router])

  // GIAO DIỆN TRẠM CHỜ
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