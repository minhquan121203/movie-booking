'use client'

import { useState } from 'react'
import { DashboardHeader } from './components/DashboardHeader'
import { KpiStats } from './components/KpiStats'
import { HorizontalChartWrapper } from './components/HorizontalChartWrapper'
import { UpcomingMoviesList } from './components/UpcomingMoviesList'
import { RecentActivities } from './components/RecentActivities'
import {
  useDashboardSummary,
  useTopMovies,
  useTopCinemas,
  transformToChartData,
} from '@/lib/api/dashboard'

// Import dữ liệu giả làm fallback
import { topMovies as fallbackMovies, topTheaters as fallbackTheaters } from './constants/mockData'

export default function AdminDashboard() {
  // State cho year filters
  const currentYear = new Date().getFullYear()
  const [moviesYear, setMoviesYear] = useState(currentYear)
  const [cinemasYear, setCinemasYear] = useState(currentYear)
  // Fetch data bằng TanStack Query hooks với year động
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorData,
  } = useDashboardSummary()

  const {
    data: topMoviesData,
    isLoading: moviesLoading,
    isError: moviesError,
    error: moviesErrorData,
  } = useTopMovies(moviesYear) // ✅ Sử dụng moviesYear state

  const {
    data: topCinemasData,
    isLoading: cinemasLoading,
    isError: cinemasError,
    error: cinemasErrorData,
  } = useTopCinemas(cinemasYear) // ✅ Sử dụng cinemasYear state

  // Transform API data sang format cho HorizontalChart với fallback
  const movieChartData =
    topMoviesData && topMoviesData.items.length > 0
      ? transformToChartData(topMoviesData.items, 'lượt xem')
      : fallbackMovies

  const cinemaChartData =
    topCinemasData && topCinemasData.items.length > 0
      ? transformToChartData(topCinemasData.items, 'Triệu VND')
      : fallbackTheaters

  // Loading state cho toàn trang (optional)
  const isLoading = summaryLoading || moviesLoading || cinemasLoading

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-gray-50/30 min-h-screen">
      <DashboardHeader />

      {/* KPI Stats */}
      <KpiStats
        summary={summary}
        isLoading={summaryLoading}
        isError={summaryError}
        error={summaryErrorData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Top Phim */}
        <HorizontalChartWrapper
          title={topMoviesData?.title || 'Top 5 Phim Xem Nhiều Nhất'}
          description={topMoviesData?.subtitle || 'Xếp hạng theo lượt xem'}
          year={moviesYear}
          data={movieChartData}
          isLoading={moviesLoading}
          isError={moviesError}
          error={moviesErrorData}
          onYearChange={setMoviesYear}
          showYearFilter={true}
        />

        {/* Biểu đồ Top Rạp */}
        <HorizontalChartWrapper
          title={topCinemasData?.title || 'Top 5 Rạp Doanh Thu Cao Nhất'}
          description={topCinemasData?.subtitle || 'Đơn vị: Triệu VND'}
          year={cinemasYear}
          data={cinemaChartData}
          isLoading={cinemasLoading}
          isError={cinemasError}
          error={cinemasErrorData}
          onYearChange={setCinemasYear}
          showYearFilter={true}
        />
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full">
          <UpcomingMoviesList />
        </div>

        <div className="h-full">
          <RecentActivities />
        </div>
      </div>
    </div>
  )
}
