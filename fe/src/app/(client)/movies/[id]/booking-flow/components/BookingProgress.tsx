import { Check } from 'lucide-react'

interface BookingProgressProps {
  currentStep: number
}

// Cập nhật STEPS để có 5 bước
export const STEPS = [
  { number: 1, label: 'Chọn suất' },
  { number: 2, label: 'Chọn ghế' },
  { number: 3, label: 'Chọn Combo' },
  { number: 4, label: 'Thanh toán' },
  { number: 5, label: 'Xác nhận' },
]

export function BookingProgress({ currentStep }: BookingProgressProps) {
  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="bg-bg-primary py-6 sm:py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="relative flex items-start justify-between max-w-3xl mx-auto">
          {/* Đường kẻ nền màu xám */}
          <div className="absolute top-5 sm:top-6 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

          {/* Đường kẻ màu (Active Progress) */}
          <div
            className="absolute top-5 sm:top-6 left-0 h-0.5 bg-primary -z-10 transition-all duration-500 ease-in-out hidden sm:block"
            style={{ width: `${progressPercentage}%` }}
          />

          {STEPS.map(step => {
            const isCompleted = step.number < currentStep
            const isCurrent = step.number === currentStep
            const isActive = step.number <= currentStep

            return (
              <div
                key={step.number}
                className="flex flex-col items-center relative z-10 w-16 sm:w-20"
              >
                {/* Circle Step */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 bg-surface ${
                    isCurrent
                      ? 'bg-primary text-text-primary border-primary shadow-[0_0_20px_rgba(108,99,255,0.4)] scale-110'
                      : isActive
                        ? 'bg-primary text-text-primary border-primary'
                        : 'text-text-secondary border-border'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <span className="font-medium text-sm sm:text-base">{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`mt-3 text-[10px] sm:text-xs font-medium text-center leading-tight transition-colors duration-300 ${
                    isCurrent ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
