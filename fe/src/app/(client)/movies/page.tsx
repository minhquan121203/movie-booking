'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import PageHeader from '@/app/(client)/movies/components/PageHeader'
import FilterCard from '@/app/(client)/movies/components/FilterCard'
import { TopMovieCarousel } from '@/app/(client)/components/topMovieCarousel'
import { MovieList } from './components/MovieList'
import { useMovies, GetMoviesParams } from '@/lib/api/movies'
import { DEFAULT_MOVIE_LIST } from '@/constants'
import { useSearchParams, useRouter } from 'next/navigation'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import type { Genre } from '@/types/genre'

// --- CONSTANTS UI ---
const movieTypes = ['Đang chiếu', 'Sắp chiếu']
const ratings = ['P', 'C13', 'C16', 'C18']
const sortOptions = ['Mới nhất', 'Mới cập nhật', 'Điểm IMDb', 'Lượt xem']

// Đổi tên function cũ thành MoviesContent (bỏ export default đi)
function MoviesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const genreFromUrl = searchParams.get('genre') || ''
  const itemsPerPage = 15

  // Đồng bộ URL với SessionStorage (để nút Quay lại luôn nhớ trang)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPage = sessionStorage.getItem('lastMoviesPage')
      if (!searchParams.has('page') && savedPage && savedPage !== '1') {
        const newSearchParams = new URLSearchParams(searchParams.toString())
        newSearchParams.set('page', savedPage)
        router.replace(`?${newSearchParams.toString()}`, { scroll: false })
      } else {
        sessionStorage.setItem('lastMoviesPage', pageFromUrl.toString())
      }
    }
  }, [pageFromUrl, searchParams, router])

  // --- 1. DRAFT STATE ---
  const [showFilters, setShowFilters] = useState(!genreFromUrl)
  const [selectedCountry, setSelectedCountry] = useState('Tất cả')
  const [selectedType, setSelectedType] = useState('Đang chiếu')
  const [selectedRating, setSelectedRating] = useState('P')
  const [selectedGenreNames, setSelectedGenreNames] = useState<string[]>(genreFromUrl ? [genreFromUrl] : [])
  const [selectedYear, setSelectedYear] = useState('Tất cả')
  const [customYear, setCustomYear] = useState('')
  const [selectedSort, setSelectedSort] = useState('Mới nhất')

  // ✅ Fetch all active movies to extract real genres & countries
  const { data: allMoviesForGenres } = useMovies({ limit: 200, page: 1 })
  const genres: Genre[] = useMemo(() => {
    const genreMap = new Map<string, Genre>()
    allMoviesForGenres?.movies?.forEach((movie: any) => {
      movie.genres?.forEach((g: any) => {
        if (g._id && g.name && !genreMap.has(g._id)) {
          genreMap.set(g._id, { _id: g._id, name: g.name, slug: g.name.toLowerCase(), description: '', displayOrder: 0, isActive: true } as Genre)
        }
      })
    })
    return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [allMoviesForGenres])

  // ✅ Extract countries from movies data
  const countries: string[] = useMemo(() => {
    const countrySet = new Set<string>()
    allMoviesForGenres?.movies?.forEach((movie: any) => {
      if (movie.country) countrySet.add(movie.country)
    })
    const sorted = Array.from(countrySet).sort((a, b) => a.localeCompare(b))
    return ['Tất cả', ...sorted]
  }, [allMoviesForGenres])

  const [queryParams, setQueryParams] = useState<GetMoviesParams>({
    page: pageFromUrl,
    limit: itemsPerPage,
    sortBy: 'releaseDate',
    order: 'desc',
    status: 'Đang chiếu',
    ...(genreFromUrl ? { genres: genreFromUrl } : {}),
  })

  // --- 3. FETCH DATA ---
  const { data: listMovies = DEFAULT_MOVIE_LIST, isLoading, isFetching } = useMovies(queryParams)

  const totalPages = listMovies?.pagination?.totalPages || 1
  const totalItems = listMovies?.pagination?.totalItems || 0

  const { data: topMoviesData = DEFAULT_MOVIE_LIST } = useMovies({
    page: 1,
    limit: 10,
    sortBy: 'view_count',
    order: 'desc',
  })

  // --- 4. APPLY FILTER ---
  const handleApplyFilter = () => {
    const params: GetMoviesParams = {
      page: 1,
      limit: itemsPerPage,
      sortBy: selectedSort === 'Mới nhất' ? 'releaseDate' : 'view_count',
      order: 'desc',

      rating: selectedRating === 'P' ? undefined : selectedRating,

      status: selectedType,

      country: selectedCountry === 'Tất cả' ? undefined : selectedCountry,

      genres: selectedGenreNames.length === 0 ? undefined : selectedGenreNames.join(','),
    }

    if (customYear) {
      params.releaseYear = parseInt(customYear, 10)
    } else if (selectedYear !== 'Tất cả') {
      params.releaseYear = parseInt(selectedYear, 10)
    }

    switch (selectedSort) {
      case 'Mới nhất':
        params.sortBy = 'releaseDate'
        params.order = 'desc'
        break
      case 'Mới cập nhật':
        params.sortBy = 'createdAt'
        params.order = 'desc'
        break
      case 'Điểm IMDb':
        params.sortBy = 'vote_average'
        params.order = 'desc'
        break
      case 'Lượt xem':
        params.sortBy = 'view_count'
        params.order = 'desc'
        break
      default:
        params.sortBy = 'releaseDate'
        params.order = 'desc'
    }

    setQueryParams(params)
  }

  // --- 5. HANDLERS ---
  const toggleGenreName = (genreName: string) => {
    if (selectedGenreNames.includes(genreName)) {
      setSelectedGenreNames(selectedGenreNames.filter(n => n !== genreName))
    } else {
      setSelectedGenreNames([...selectedGenreNames, genreName])
    }
  }

  useEffect(() => {
    setQueryParams(prev => ({ ...prev, page: pageFromUrl }))
  }, [pageFromUrl])

  const updateUrlParams = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('page', newPage.toString())
    router.push(`?${newSearchParams.toString()}`, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }))
    updateUrlParams(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PageHeader
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {showFilters && (
          <FilterCard
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            movieTypes={movieTypes}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            ratings={ratings}
            selectedRating={selectedRating}
            onSelectRating={setSelectedRating}
            genres={genres}
            selectedGenreIds={selectedGenreNames}
            onToggleGenreId={toggleGenreName}
            customYear={customYear}
            onSetCustomYear={setCustomYear}
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            onClose={() => setShowFilters(false)}
            onApplyFilter={handleApplyFilter}
            isLoading={isLoading || isFetching}
          />
        )}

        <div id="movie-list-section">
          {isLoading || isFetching ? (
            <div className="text-white py-4 text-center animate-pulse">Đang lọc phim...</div>
          ) : (
            <>
              <MovieList
                title={`🎬 Kết quả lọc (${totalItems} phim)`}
                movies={listMovies.movies}
                viewAllHref="#"
              />
              <div className="flex flex-col gap-4 mt-4">
                <PaginationInfo
                  currentPage={queryParams.page || 1}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />

                <CustomPagination
                  currentPage={queryParams.page || 1}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  showPageNumbers={5}
                />
              </div>
            </>
          )}

          {!isLoading && !isFetching && listMovies.movies.length === 0 && (
            <div className="text-center py-10 text-gray-400">Không tìm thấy phim nào phù hợp.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PhimLoc() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Đang tải trang phim...</div>}>
      <MoviesContent />
    </Suspense>
  )
}