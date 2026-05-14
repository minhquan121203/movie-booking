'use client'
import { HeroSection } from '@/app/(client)/components/hero-section'
import { GenreGrid } from '@/app/(client)/components/genre-grid'
import { useState, useRef } from 'react'
import { ShowtimeSection } from '@/app/(client)/components/showtimeSection'
import { ShowtimeSectionSkeleton } from '@/app/(client)/components/ShowtimeSectionSkeleton'
import { useMovies } from '@/lib/api/movies'
import { useTheaters } from '@/lib/api/theaters'
import { useGenres } from '@/lib/api/genres'
import { DEFAULT_THEATER_LIST, DEFAULT_GENRE_LIST } from '@/constants'
import { MovieCard } from '@/app/(client)/components/movie-card'
import { Flame, Popcorn, CalendarClock } from 'lucide-react'
import { useSchedules } from '@/lib/api/schedules'

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Hà Nội')
  
  const [activeTab, setActiveTab] = useState<'now' | 'coming' | 'top'>('now')
  const movieSectionRef = useRef<HTMLElement>(null)

  const scrollToMovies = (tab: 'now' | 'coming' | 'top') => {
    setActiveTab(tab)
    // Scroll to the movie section after a small delay so the tab switch renders
    setTimeout(() => {
      movieSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Fetch Top Movies
  const { data: topMovieData, isLoading: loadingTop } = useMovies({
    limit: 12,
    sortBy: 'averageRating',
    order: 'desc',
  })

  // Fetch Phim Đang Chiếu 
  const { data: nowShowingData, isLoading: loadingNow } = useMovies({
    limit: 100,
    status: 'Đang chiếu', 
  })

  // Fetch Phim Sắp Chiếu 
  const { data: comingSoonData, isLoading: loadingSoon } = useMovies({
    limit: 100,
    status: 'Sắp chiếu', 
  })

  const { data: allSchedulesData } = useSchedules({ limit: 1000 })
  const allActiveSchedules = allSchedulesData?.schedules || []

  const moviesWithSchedules = new Set(
    allActiveSchedules.map((schedule: any) => schedule.movie?._id || schedule.movieId)
  )

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
        <section ref={movieSectionRef} className="w-full scroll-mt-20">
          <div className="flex justify-center mb-8 w-full px-2">
            <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl w-full max-w-md mx-auto shadow-inner">
              
              <button
                onClick={() => scrollToMovies('top')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all duration-300 ${
                  activeTab === 'top' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap uppercase">Top Movies</span>
              </button>

              <button
                onClick={() => scrollToMovies('now')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all duration-300 ${
                  activeTab === 'now' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Popcorn className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap uppercase">Đang chiếu</span>
              </button>

              <button
                onClick={() => scrollToMovies('coming')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all duration-300 ${
                  activeTab === 'coming' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap uppercase">Sắp chiếu</span>
              </button>

            </div>
          </div>

          {(loadingTop || loadingNow || loadingSoon) ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">Đang tải dữ liệu phim...</div>
          ) : displayMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
              {displayMovies.map((movie, index) => {
                
                // --- BƯỚC 2: SO SÁNH ID ---
                const canBook = moviesWithSchedules.has(movie._id)

                return (
                  <MovieCard 
                    key={movie._id} 
                    movie={movie} 
                    index={index} 
                    showBookButton={canBook} 
                  />
                )
              })}
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