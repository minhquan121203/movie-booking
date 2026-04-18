import { Skeleton } from '@/components/ui/skeleton'

export function MovieHeaderSkeleton() {
  return (
    <>
      {/* Back Button Skeleton */}
      <Skeleton className="h-10 w-32 mb-4" />

      <section className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-0 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        {/* Poster Skeleton */}
        <div className="relative rounded-2xl overflow-hidden border border-border h-[480px] md:h-[520px] lg:h-[540px]">
          <Skeleton className="w-full h-full" />
        </div>

        {/* Info Section Skeleton */}
        <div className="flex flex-col space-y-6">
          {/* Title + Rating Skeleton */}
          <div>
            <Skeleton className="h-8 md:h-9 w-3/4 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Info Boxes Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div
                key={i}
                className="border border-border rounded-xl py-5 px-6 text-center bg-surface"
              >
                <Skeleton className="w-5 h-5 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto mb-2" />
                <Skeleton className="h-5 w-20 mx-auto" />
              </div>
            ))}
          </div>

          {/* Description Skeleton */}
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Director & Cast Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>

          {/* Genres Skeleton */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>

          {/* Booking Button Skeleton */}
          <Skeleton className="w-full h-14 rounded-lg" />
        </div>
      </section>
    </>
  )
}
