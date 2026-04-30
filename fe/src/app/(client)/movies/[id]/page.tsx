'use client'
import { MovieHeader } from '@/app/(client)/movies/[id]/components/MovieHeader'
import { ShowtimeSection } from '@/app/(client)/movies/[id]/components/ShowtimeSection'
import { ReviewSection } from '@/app/(client)/movies/[id]/components/ReviewSection'
import { RelatedMovies } from '@/app/(client)/movies/[id]/components/RelatedMovies'
export default function MovieDetailPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-[1200px] mx-auto px-4 py-12 space-y-16">
        <MovieHeader />
        <ShowtimeSection />
        <ReviewSection />
        <RelatedMovies />
      </div>
    </div>
  )
}
