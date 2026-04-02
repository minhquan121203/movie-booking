'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

function PaymentProcessor() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('Đang xử lý giao dịch. Vui lòng không đóng trang...')

  useEffect(() => {
    // Chỉ chạy khi router ready
    if (!searchParams) return;

    const processPayment = async () => {
      // 1. ĐỌC DỮ LIỆU MOMO / VNPAY TRẢ VỀ TỪ URL
      const vnpResponseCode = searchParams.get('vnp_ResponseCode')
      const vnpTxnRef = searchParams.get('vnp_TxnRef')

      const momoResultCode = searchParams.get('resultCode')
      const momoOrderId = searchParams.get('orderId')
      const momoExtraData = searchParams.get('extraData')

      const isVnpaySuccess = vnpResponseCode === '00'
      const isMomoSuccess = momoResultCode === '0'

      // Nếu khách hủy thanh toán -> Đá về trang chủ
      if (searchParams.toString() && !isVnpaySuccess && !isMomoSuccess) {
        setStatus('Giao dịch thất bại hoặc bị hủy. Đang quay về trang chủ...')
        setTimeout(() => router.push('/'), 2000)
        return
      }

      // 2. KHUI LẤY BOOKING ID & THÔNG TIN GIAO DỊCH
      let bookingId = searchParams.get('bookingId')
      let paymentMethod = ''
      let transactionId = ''

      if (isMomoSuccess) {
        paymentMethod = 'MoMo'
        transactionId = momoOrderId || ''
        // Khui extraData để lấy bookingId
        if (momoExtraData) {
          try {
            const decodedData = JSON.parse(atob(momoExtraData))
            bookingId = decodedData.bookingId
          } catch (e) {
            console.error("Lỗi giải mã extraData:", e)
          }
        }
      } else if (isVnpaySuccess) {
        paymentMethod = 'VNPAY'
        transactionId = vnpTxnRef || ''
      }

      if (!bookingId) return; // Nếu load lần đầu chưa có ID thì chờ

      // 3. GỌI API ÉP BACKEND CHỐT ĐƠN VÀ TẠO QR CODE XỊN
      try {
        setStatus('Đang xác nhận thanh toán & sinh mã vé QR...')
        
        // Gọi thẳng vào API confirmPayment của BE
        await axios.post(`https://movie-booking-api-bcfe.onrender.com/api/bookings/${bookingId}/confirm`, {
          paymentMethod: paymentMethod,
          transactionId: transactionId
        })
        
        setStatus('Thành công! Đang chuyển đến Lịch sử vé...')
      } catch (error) {
        console.error('Lỗi duyệt đơn:', error)
      } finally {
        // 4. CHỐT HẠ: DÙ THÀNH CÔNG HAY LỖI CŨNG ĐÁ THẲNG VỀ ORDER HISTORY
        router.push('/order-history')
      }
    }

    processPayment()
  }, [searchParams, router])

  // GIAO DIỆN TRẠM TRUNG CHUYỂN (Chỉ hiện 1-2 giây)
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
      <h2 className="text-2xl font-bold text-text-primary mb-2">Đang xác nhận thanh toán</h2>
      <p className="text-text-secondary animate-pulse">{status}</p>
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