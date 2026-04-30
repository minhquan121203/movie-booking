'use client'

import { useState, useEffect, Suspense } from 'react' // Import thêm Suspense ở đây
import PageHeader from '@/app/(client)/movies/components/PageHeader'
import FilterCard from '@/app/(client)/movies/components/FilterCard'
import { TopMovieCarousel } from '@/app/(client)/components/topMovieCarousel'
import { MovieList } from './components/MovieList'
import { useMovies, GetMoviesParams } from '@/lib/api/movies'
import { DEFAULT_MOVIE_LIST } from '@/constants'
import { COUNTRIES } from '@/constants/location'
import { useGenres } from '@/lib/api/genres'
import { DEFAULT_GENRE_LIST } from '@/constants'
import { useSearchParams, useRouter } from 'next/navigation'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import type { Genre } from '@/types/genre'

// --- CONSTANTS UI ---
const movieTypes = ['Tất cả', 'Đang chiếu', 'Sắp chiếu']
const ratings = ['P', 'C13', 'C16', 'C18']
const sortOptions = ['Mới nhất', 'Mới cập nhật', 'Điểm IMDb', 'Lượt xem']

// Đổi tên function cũ thành MoviesContent (bỏ export default đi)
function MoviesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 15

  // --- 1. DRAFT STATE ---
  const [showFilters, setShowFilters] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState('Tất cả')
  const [selectedType, setSelectedType] = useState('Tất cả')
  const [selectedRating, setSelectedRating] = useState('P')
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState('Tất cả')
  const [customYear, setCustomYear] = useState('')
  const [selectedSort, setSelectedSort] = useState('Mới nhất')

  // ✅ Fetch genres từ API
  const { data: genresData = DEFAULT_GENRE_LIST } = useGenres({})
  const genres: Genre[] = genresData.items || []

  const [queryParams, setQueryParams] = useState<GetMoviesParams>({
    page: pageFromUrl,
    limit: itemsPerPage,
    sortBy: 'releaseDate',
    order: 'desc',
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
      status:
        selectedType === 'Tất cả'
          ? undefined
          : selectedType === 'Đang chiếu'
            ? 'showing'
            : 'coming_soon',
      country: selectedCountry === 'Tất cả' ? undefined : selectedCountry,
      genres: selectedGenreIds.length === 0 ? undefined : selectedGenreIds.join(','),
    }

    if (customYear) {
      params.year = parseInt(customYear, 10)
    } else if (selectedYear !== 'Tất cả') {
      params.year = parseInt(selectedYear, 10)
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
  const toggleGenreId = (genreId: string) => {
    if (selectedGenreIds.includes(genreId)) {
      setSelectedGenreIds(selectedGenreIds.filter(id => id !== genreId))
    } else {
      setSelectedGenreIds([...selectedGenreIds, genreId])
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
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <PageHeader
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {showFilters && (
          <FilterCard
            countries={COUNTRIES}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            movieTypes={movieTypes}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            ratings={ratings}
            selectedRating={selectedRating}
            onSelectRating={setSelectedRating}
            genres={genres}
            selectedGenreIds={selectedGenreIds}
            onToggleGenreId={toggleGenreId}
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
                title={`🎬 Kết quả lọc (${listMovies.pagination?.totalItems || 0} phim)`}
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