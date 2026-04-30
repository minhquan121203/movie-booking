'use client'

import { useParams } from 'next/navigation'
import { MovieHeader } from '@/app/(client)/movies/[id]/components/MovieHeader'
import { ShowtimeSection } from '@/app/(client)/movies/[id]/components/ShowtimeSection'
import { ReviewSection } from '@/app/(client)/movies/[id]/components/ReviewSection'
import { RelatedMovies } from '@/app/(client)/movies/[id]/components/RelatedMovies'
import { useSchedules } from '@/lib/api/schedules' 

export default function MovieDetailPage() {
  const { id } = useParams()
  const movieId = Array.isArray(id) ? id[0] : id

  const { data: scheduleData, isLoading: loadingSchedules } = useSchedules({ 
    movieId: movieId ?? '' 
  })

  const showtimes = scheduleData?.schedules || [] 

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-[1200px] mx-auto px-4 py-12 space-y-16">
        <MovieHeader showtimes={showtimes} isLoadingSchedules={loadingSchedules} />
        <ShowtimeSection movieId={movieId} />
        <ReviewSection />
        <RelatedMovies />
      </div>
    </div>
  )
}