'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 1. Tách nội dung giao diện ra một Component riêng
function PaymentFailedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const message = searchParams.get('message')
  
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center border-red-100 bg-red-50/50">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Thanh toán thất bại</h2>
        <p className="text-text-secondary mb-8">
          Giao dịch của bạn không thành công hoặc đã bị hủy. Vui lòng thử lại. Lỗi: {message || 'Không xác định'}
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

// 2. Export default là cái Component đã được bọc Suspense
export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Đang kiểm tra giao dịch...</div>}>
      <PaymentFailedContent />
    </Suspense>
  )
}