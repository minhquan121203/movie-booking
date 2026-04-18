import { Button } from '@/components/ui/button'
import { Film, X } from 'lucide-react'

interface BookingHeaderProps {
  onClose?: () => void
}

export function BookingHeader({ onClose }: BookingHeaderProps) {
  return (
    <header className="bg-bg-primary py-4 sticky top-0 z-10">
      <div className="max-w-[1400px]  mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"></div>
          <Button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-primary hover:bg-accent flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-text-primary" />
          </Button>
        </div>
      </div>
    </header>
  )
}
