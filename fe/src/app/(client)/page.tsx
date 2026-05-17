'use client'
import { HeroSection } from '@/app/(client)/components/hero-section'
import { GenreGrid } from '@/app/(client)/components/genre-grid'
import { useState, useRef, useMemo } from 'react'
import { ShowtimeSection } from '@/app/(client)/components/showtimeSection'
import { ShowtimeSectionSkeleton } from '@/app/(client)/components/ShowtimeSectionSkeleton'
import { useMovies } from '@/lib/api/movies'
import { useTheaters } from '@/lib/api/theaters'
import { DEFAULT_THEATER_LIST } from '@/constants'
import type { Genre } from '@/types/genre'
import { MovieCard } from '@/app/(client)/components/movie-card'
import { Flame, Popcorn, CalendarClock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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

  // Fetch Top Movies (Chỉ lấy phim Đang chiếu để luôn hiện nút MUA VÉ)
  const { data: topMovieData, isLoading: loadingTop } = useMovies({
    limit: 12,
    sortBy: 'averageRating',
    order: 'desc',
    status: 'Đang chiếu',
  })

  // Fetch Phim Đang Chiếu 
  const { data: nowShowingData, isLoading: loadingNow } = useMovies({
    limit: 60,
    status: 'Đang chiếu',
  })

  // Fetch Phim Sắp Chiếu 
  const { data: comingSoonData, isLoading: loadingSoon } = useMovies({
    limit: 60,
    status: 'Sắp chiếu',
  })


  const { data: listTheater = DEFAULT_THEATER_LIST, isLoading: loadingTheater } = useTheaters({
    city: selectedCity,
    limit: 100,
    isActive: 'true',
    sortBy: 'name',
    order: 'asc',
  })

  // Extract genres from movies data (same source as movies filter page)
  const moviesForGenres = nowShowingData?.movies || topMovieData?.movies || []
  const movieGenres: Genre[] = useMemo(() => {
    const genreMap = new Map<string, Genre>()
    moviesForGenres.forEach((movie: any) => {
      movie.genres?.forEach((g: any) => {
        if (g._id && g.name && !genreMap.has(g._id)) {
          genreMap.set(g._id, { _id: g._id, name: g.name, slug: g.name.toLowerCase(), description: '', displayOrder: 0, isActive: true } as Genre)
        }
      })
    })
    return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [moviesForGenres])
  const loadingGenres = loadingNow && loadingTop

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
  }

  const heroMovies = topMovieData?.movies || []

  const TOP_MOVIE_LIMIT = 12

  const allMoviesForTab: any[] =
    activeTab === 'now' ? (nowShowingData?.movies || []) :
      activeTab === 'coming' ? (comingSoonData?.movies || []) :
        (topMovieData?.movies || [])

  // Đang chiếu & Sắp chiếu: hiện hết. Top Movies: giới hạn 12
  const displayMovies = activeTab === 'top' ? allMoviesForTab.slice(0, TOP_MOVIE_LIMIT) : allMoviesForTab
  const hasMore = activeTab === 'top' && allMoviesForTab.length > TOP_MOVIE_LIMIT


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
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all duration-300 ${activeTab === 'top' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap uppercase">Top Movies</span>
              </button>

              <button
                onClick={() => scrollToMovies('now')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all duration-300 ${activeTab === 'now' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Popcorn className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap uppercase">Đang chiếu</span>
              </button>

              <button
                onClick={() => scrollToMovies('coming')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all duration-300 ${activeTab === 'coming' ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
                {displayMovies.map((movie, index) => {
                  // Dùng movie.status từ DB — hiện ngay lập tức, không cần chờ API schedules
                  const canBook = movie.status === 'Đang chiếu'
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

              {/* Xem tất cả button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Link
                    href="/movies"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-violet-500/25 hover:scale-105"
                  >
                    Xem tất cả {allMoviesForTab.length} phim
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted animate-in fade-in duration-500">
              <p className="text-muted-foreground font-medium">Hiện tại chưa có phim nào trong mục này.</p>
            </div>
          )}
        </section>

        <GenreGrid genres={movieGenres} isLoading={loadingGenres} />

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