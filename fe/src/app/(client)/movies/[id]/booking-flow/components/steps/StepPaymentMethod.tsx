import { Wallet, CreditCard, Building2, ShieldCheck, Zap, Clock } from 'lucide-react'
import Image from 'next/image'

// 1. Cập nhật Type để nhận thêm phương thức 'bank_transfer'
interface StepPaymentMethodProps {
  selectedMethod: 'vnpay' | 'momo' | 'bank_transfer' | null
  onSelect: (method: 'vnpay' | 'momo' | 'bank_transfer') => void
}

export function StepPaymentMethod({ selectedMethod, onSelect }: StepPaymentMethodProps) {
  const paymentMethods = [
    {
      id: 'vnpay' as const,
      name: 'VNPAY',
      description: 'Thanh toán qua cổng VNPAY',
      icon: <CreditCard className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'momo' as const,
      name: 'MoMo',
      description: 'Thanh toán qua ví MoMo',
      icon: <Wallet className="w-8 h-8" />,
      color: 'from-pink-500 to-pink-600',
    },
    // 2. THÊM VIETQR VÀO ĐÂY
    {
      id: 'bank_transfer' as const,
      name: 'VietQR',
      description: 'Chuyển khoản Ngân hàng',
      icon: <Building2 className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
    },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-6 text-text-primary text-xl font-bold">Chọn phương thức thanh toán</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {paymentMethods.map(method => {
          const isSelected = selectedMethod === method.id

          return (
            <div
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`relative bg-surface rounded-2xl p-6 cursor-pointer transition-all duration-300 border-2 flex flex-col items-center text-center ${
                isSelected
                  ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5 scale-105'
                  : 'border-border hover:border-primary/30 hover:bg-bg-secondary hover:scale-102'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white mb-4 shadow-lg transform transition-transform group-hover:rotate-6`}
              >
                {method.icon}
              </div>

              {/* Tên phương thức */}
              <h3 className="text-text-primary font-bold text-lg mb-1">{method.name}</h3>

              {/* Mô tả */}
              <p className="text-text-secondary text-xs mb-4 min-h-[32px]">{method.description}</p>

              {/* Features - Tối ưu lại cho gọn */}
              <div className="w-full pt-4 border-t border-border space-y-2 text-left">
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                  <span>Bảo mật 100%</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <Zap className="w-3 h-3 text-green-500" />
                  <span>Xử lý tức thì</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <Clock className="w-3 h-3 text-green-500" />
                  <span>Hỗ trợ 24/7</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm max-w-3xl mx-auto shadow-sm">
        <div className="flex gap-3">
          <div className="bg-blue-100 p-2 rounded-lg shrink-0">
             <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold mb-0.5">Lưu ý thanh toán</p>
            <p className="opacity-90">
              Vui lòng hoàn tất thanh toán trong vòng <strong>10 phút</strong>. Nếu chọn VietQR, hãy chụp màn hình bill sau khi chuyển để đối chiếu khi cần nhé!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}