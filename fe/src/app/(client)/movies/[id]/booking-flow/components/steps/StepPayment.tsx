import { Wallet, ExternalLink, CheckCircle2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react' 

interface StepPaymentProps {
  paymentUrl: string 
  bookingCode?: string
  totalAmount: number
  paymentMethod: string | null
}

export function StepPayment({ paymentUrl, bookingCode, totalAmount, paymentMethod }: StepPaymentProps) {
  const isBankTransfer = paymentMethod === 'bank_transfer'
  const isMomo = paymentMethod === 'MoMo' || paymentMethod === 'momo'
  const isVnpay = paymentMethod === 'VNPAY' || paymentMethod === 'vnpay'

  useEffect(() => {
    if ((isMomo || isVnpay || isBankTransfer) && paymentUrl) {
      window.location.href = paymentUrl;
    }
  }, [isMomo, isVnpay, isBankTransfer, paymentUrl]);

  // Cập nhật giao diện chờ tải cho cả 3 cổng
  if (isMomo || isVnpay || isBankTransfer) {
    const gatewayName = isMomo ? 'MoMo' : isVnpay ? 'VNPAY' : 'Cổng thanh toán PayOS';
    
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Đang chuyển hướng đến {gatewayName}...</h2>
        <p className="text-text-secondary text-sm">Vui lòng không đóng trình duyệt.</p>
      </div>
    )
  }

  // Fallback (Phòng hờ nếu trình duyệt chặn tự động chuyển trang)
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-6 text-text-primary text-xl font-bold">Thanh toán đơn hàng</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm shadow-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold mb-1">Đơn hàng đã sẵn sàng!</p>
                <p>Vui lòng hoàn tất thanh toán trong <strong>10 phút</strong>.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Phương thức đã chọn:</p>
            <div className="flex items-center gap-3 p-4 border-2 border-primary bg-primary/5 rounded-xl shadow-sm">
              <Building2 className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="font-bold text-primary">Chuyển khoản VietQR (PayOS)</p>
                <p className="text-xs text-text-secondary">Tự động xác nhận sau khi chuyển tiền thành công</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border">
             <p className="text-xs text-text-secondary mb-1 uppercase font-bold">Tổng số tiền:</p>
             <p className="text-2xl font-black text-primary">{totalAmount.toLocaleString()} đ</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-surface p-6 rounded-2xl border-2 border-primary/20 shadow-md">
          <p className="text-sm font-medium text-text-primary mb-4 text-center">
            Click vào nút bên dưới nếu trình duyệt không tự chuyển trang
          </p>

          <div className="w-full space-y-3">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-bold shadow-lg">
              <Link href={paymentUrl}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Đến trang thanh toán ngay
              </Link>
            </Button>
            
            <p className="text-[11px] text-center text-text-secondary px-4 italic">
              * Sau khi chuyển khoản thành công, hệ thống sẽ tự động cập nhật trạng thái vé trong giây lát.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}