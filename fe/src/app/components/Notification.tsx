import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NotificationProps {
  type: 'success' | 'error'
  title: string
  message?: string
  onClose: () => void
}

export const NotificationToast = ({ type, title, message, onClose }: NotificationProps) => {
  const isSuccess = type === 'success'

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none flex justify-center"
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg transition-all',
          // Style cho Success
          isSuccess && 'bg-green-50 border-green-200 text-green-900',
          // Style cho Error (Giống ảnh bạn gửi)
          !isSuccess && 'bg-[#FFF5F5] border-[#FEB2B2] text-[#C53030]'
        )}
      >
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">!</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-5">{title}</h3>
          {message && (
            <p
              className={cn(
                'mt-1 text-sm leading-5 opacity-90',
                isSuccess ? 'text-green-700' : 'text-[#C53030]'
              )}
            >
              {message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            'shrink-0 rounded-md p-1 transition-colors',
            isSuccess ? 'hover:bg-green-100 text-green-600' : 'hover:bg-red-100 text-red-500'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
