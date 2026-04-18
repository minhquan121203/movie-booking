'use client'
import { HeroSection } from '@/app/(client)/components/hero-section'
import { GenreGrid } from '@/app/(client)/components/genre-grid'
import { MovieSection } from '@/app/(client)/components/movie-section'
import { useState } from 'react'
import { ShowtimeSection } from '@/app/(client)/components/showtimeSection'
import { ShowtimeSectionSkeleton } from '@/app/(client)/components/ShowtimeSectionSkeleton'
import { TopMovieCarousel } from '@/app/(client)/components/topMovieCarousel'
import { useMovies } from '@/lib/api/movies'
import { useTheaters } from '@/lib/api/theaters'
import { useGenres } from '@/lib/api/genres'
import { DEFAULT_THEATER_LIST, DEFAULT_GENRE_LIST } from '@/constants'

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Hà Nội')

  // Fetch Top Movies (Sắp xếp theo Rating cao nhất)
  const { data: topMovieData, isLoading: loadingTop } = useMovies({
    limit: 10,
    sortBy: 'averageRating', // Lấy phim điểm cao nhất làm Top
    order: 'desc',
  })

  // Fetch Phim Đang Chiếu 
  const { data: nowShowingData, isLoading: loadingNow } = useMovies({
    limit: 8,
    status: 'Đang chiếu', 
  })

  // Fetch Phim Sắp Chiếu 
  const { data: comingSoonData, isLoading: loadingSoon } = useMovies({
    limit: 8,
    status: 'Sắp chiếu', 
  })

  const { data: listTheater = DEFAULT_THEATER_LIST, isLoading: loadingTheater } = useTheaters({
    city: selectedCity,
    limit: 100,
    isActive: 'true',
    sortBy: 'name',
    order: 'asc',
  })

  const { data: listGenres = DEFAULT_GENRE_LIST, isLoading: loadingGenres } = useGenres({})

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
  }
  
  // Dùng Top Movies làm Banner luôn cho xịn
  const heroMovies = topMovieData?.movies || []

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <HeroSection movies={heroMovies} isLoading={loadingTop} />

      <main
        className="
          w-full max-w-none
          px-[25px] md:px-[60px] xl:px-[86px] 
          py-12 space-y-16
        "
      >
        <TopMovieCarousel
          title="🔥 Top Movies"
          movies={topMovieData?.movies || []}
          isLoading={loadingTop}
        />

        <MovieSection
          title="🎟️ Đang chiếu"
          movies={nowShowingData?.movies || []}
          viewAllHref="/movies?status=Đang+chiếu"
          isLoading={loadingNow}
        />

        <MovieSection
          title="📅 Sắp chiếu"
          movies={comingSoonData?.movies || []}
          viewAllHref="/movies?status=Sắp+chiếu"
          isLoading={loadingSoon}
        />

        <GenreGrid genres={listGenres.items} isLoading={loadingGenres} />

        {loadingTheater ? (
          <ShowtimeSectionSkeleton />
        ) : (
          <ShowtimeSection
            cinemas={listTheater.theaters}
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
          />
        )}
      </main>
    </div>
  )
}