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
import { DEFAULT_MOVIE_LIST, DEFAULT_THEATER_LIST, DEFAULT_GENRE_LIST } from '@/constants'

export default function HomePage() {
  // State cho city - được quản lý ở component cha
  const [selectedCity, setSelectedCity] = useState('Hà Nội')

  // Fetch data với selectedCity và các params khác
  const {
    data: listMovies = DEFAULT_MOVIE_LIST,
    isLoading: loadingMovies,
    error: errorMovies,
  } = useMovies({})

  const { data: listTheater = DEFAULT_THEATER_LIST, isLoading: loadingTheater } = useTheaters({
    city: selectedCity,
    limit: 100, // Lấy nhiều rạp hơn
    isActive: 'true', // Chỉ lấy rạp đang hoạt động
    sortBy: 'name',
    order: 'asc',
  })

  const { data: listGenres = DEFAULT_GENRE_LIST, isLoading: loadingGenres } = useGenres({})

  // Handler để update city từ ShowtimeSection
  const handleCityChange = (city: string) => {
    setSelectedCity(city)
  }
  
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <HeroSection movies={listMovies?.movies} isLoading={loadingMovies} />

      {errorMovies && (
        <div className="text-center text-red-500 py-4">
          <span>Lỗi load data movies</span>
        </div>
      )}

      <main
        className="
          w-full max-w-none
          px-[25px] md:px-[60px] xl:px-[86px] 
          py-12 space-y-16
        "
      >
        <TopMovieCarousel
          title="🔥 Top Movies"
          movies={listMovies.movies}
          isLoading={loadingMovies}
        />

        <MovieSection
          title="🎟️ Đang chiếu"
          movies={listMovies.movies.slice(5, 9)}
          viewAllHref="/movies"
          isLoading={loadingMovies}
        />

        <MovieSection
          title="📅 Sắp chiếu"
          movies={listMovies.movies.slice(1, 5)}
          viewAllHref="/movies"
          isLoading={loadingMovies}
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