import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Theater } from '@/types/theater'
import ShowtimeClient from './ShowtimeClient'

interface ShowtimeSectionProps {
  cinemas: Theater[]
  selectedCity: string
  onCityChange: (city: string) => void
}

export function ShowtimeSection({ cinemas, selectedCity, onCityChange }: ShowtimeSectionProps) {
  return (
    <section className="py-16 bg-background text-foreground overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <h2 className="text-center text-2xl font-semibold mb-8">Lịch chiếu phim</h2>

        <Card className="rounded-3xl border border-border bg-surface shadow-sm p-4 md:p-8 w-full max-w-full overflow-hidden">
          {/* Info Card */}
          <Card className="bg-accent/10 border-accent/30 p-3 sm:p-4 rounded-2xl mb-6">
            <div className="flex items-center gap-2 text-text-primary">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-accent flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium">
                Lịch chiếu có thể thay đổi. Vui lòng kiểm tra kỹ trước khi đặt vé.
              </span>
            </div>
          </Card>

          {/* Client Component xử lý tương tác */}
          <ShowtimeClient
            cinemas={cinemas}
            selectedCity={selectedCity}
            onCityChange={onCityChange}
          />

          {/* Footer */}
          <div className="text-center mt-8 sm:mt-10">
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 rounded-full px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg shadow-md"
            >
              <Link href="/showtimes">Xem tất cả lịch chiếu</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
