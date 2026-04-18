import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ShowtimeSectionSkeleton() {
  return (
    <section className="py-16 bg-background text-foreground overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Title Skeleton */}
        <div className="flex justify-center mb-8">
          <Skeleton className="h-8 w-48" />
        </div>

        <Card className="rounded-3xl border border-border bg-surface shadow-sm p-4 md:p-8 w-full max-w-full overflow-hidden">
          {/* Top Toolbar Skeleton */}
          <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-10 w-[160px] sm:w-[180px] rounded-2xl" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>

          {/* City Quick Tabs Skeleton */}
          <div className="flex gap-2 mb-6 overflow-x-hidden pb-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
            ))}
          </div>

          {/* Info Card Skeleton */}
          <Card className="bg-accent/10 border-accent/30 p-3 sm:p-4 rounded-2xl mb-6">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 flex-1" />
            </div>
          </Card>

          {/* Main Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
            {/* Left: Cinema List Skeleton */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-3 sm:p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right: Date & Showtimes Skeleton */}
            <div className="space-y-6 min-w-0">
              {/* Date Selector Skeleton */}
              <div className="flex gap-2 overflow-x-hidden pb-2">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="flex-shrink-0 w-16 sm:w-20 py-2 sm:py-3 rounded-xl">
                    <div className="space-y-2 flex flex-col items-center">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                  </Card>
                ))}
              </div>

              {/* Empty State Skeleton */}
              <div className="text-center py-16 bg-surface border border-border rounded-2xl flex flex-col items-center justify-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2 flex flex-col items-center">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Button Skeleton */}
          <div className="text-center mt-8 sm:mt-10">
            <Skeleton className="h-12 sm:h-14 w-48 sm:w-56 rounded-full mx-auto" />
          </div>
        </Card>
      </div>
    </section>
  )
}

// Skeleton nhỏ gọn hơn cho khi đang load schedules
export function ShowtimeContentSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 rounded-2xl">
          <div className="flex gap-4">
            {/* Poster Skeleton */}
            <Skeleton className="w-20 h-28 rounded-lg flex-shrink-0" />

            {/* Info Skeleton */}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              {/* Time Slots Skeleton */}
              <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-9 w-20 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
