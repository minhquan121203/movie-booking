'use client'
import { HeroSection } from '@/app/(client)/components/hero-section'
import { GenreGrid } from '@/app/(client)/components/genre-grid'
import { useState } from 'react'
import { ShowtimeSection } from '@/app/(client)/components/showtimeSection'
import { ShowtimeSectionSkeleton } from '@/app/(client)/components/ShowtimeSectionSkeleton'
import { useMovies } from '@/lib/api/movies'
import { useTheaters } from '@/lib/api/theaters'
import { useGenres } from '@/lib/api/genres'
import { DEFAULT_THEATER_LIST, DEFAULT_GENRE_LIST } from '@/constants'
import { MovieCard } from '@/app/(client)/components/movie-card'
import { Flame, Popcorn, CalendarClock } from 'lucide-react'

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Hà Nội')
  
  const [activeTab, setActiveTab] = useState<'now' | 'coming' | 'top'>('now')

  // Fetch Top Movies
  const { data: topMovieData, isLoading: loadingTop } = useMovies({
    limit: 10,
    sortBy: 'averageRating',
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
  
  const heroMovies = topMovieData?.movies || []

  let displayMovies: any[] = []
  if (activeTab === 'now') displayMovies = nowShowingData?.movies || []
  else if (activeTab === 'coming') displayMovies = comingSoonData?.movies || []
  else if (activeTab === 'top') displayMovies = topMovieData?.movies || []

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
        <section className="w-full">
          <div className="flex justify-center mb-8">
            <div className="flex bg-muted/50 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-inner">
              
              <button
                onClick={() => setActiveTab('now')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'now' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Popcorn className="w-4 h-4" />
                ĐANG CHIẾU
              </button>

              <button
                onClick={() => setActiveTab('coming')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'coming' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                SẮP CHIẾU
              </button>

              <button
                onClick={() => setActiveTab('top')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'top' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Flame className="w-4 h-4" />
                TOP MOVIES
              </button>

            </div>
          </div>

          {(loadingTop || loadingNow || loadingSoon) ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">Đang tải dữ liệu phim...</div>
          ) : displayMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
              {displayMovies.map((movie, index) => (
                <MovieCard 
                  key={movie._id} 
                  movie={movie} 
                  index={index} 
                  showBookButton={activeTab !== 'coming'} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted animate-in fade-in duration-500">
              <p className="text-muted-foreground font-medium">Hiện tại chưa có phim nào trong mục này.</p>
            </div>
          )}
        </section>

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