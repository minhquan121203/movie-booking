import { api } from '@/lib/api/axios'
import { useQuery } from '@tanstack/react-query'

// --- 1. Types ---

// Top Employees (Nhân viên xuất sắc)
export interface TopEmployeeItem {
  name: string
  value: number
}

export interface TopEmployeesData {
  title: string
  subtitle: string
  year: number
  items: TopEmployeeItem[]
}

export interface TopEmployeesResponse {
  success: boolean
  message: string
  data: TopEmployeesData
}

// Top Performance Movies (Phim hiệu suất cao)
export interface TopPerformanceMovieItem {
  name: string
  value: number
}

export interface TopPerformanceMoviesData {
  title: string
  subtitle: string
  year: number
  items: TopPerformanceMovieItem[]
}

export interface TopPerformanceMoviesResponse {
  success: boolean
  message: string
  data: TopPerformanceMoviesData
}

// Top Effective Cinemas (Rạp hoạt động hiệu quả)
export interface TopEffectiveCinemaItem {
  name: string
  value: number
}

export interface TopEffectiveCinemasData {
  title: string
  subtitle: string
  year: number
  items: TopEffectiveCinemaItem[]
}

export interface TopEffectiveCinemasResponse {
  success: boolean
  message: string
  data: TopEffectiveCinemasData
}

// Performance Trend (Xu hướng hiệu suất)
export interface PerformanceTrendValue {
  name: string
  value: number
}

export interface PerformanceTrendMonth {
  tenThang: string
  values: PerformanceTrendValue[]
}

export interface PerformanceTrendData {
  title: string
  subtitle: string
  year: number
  months: PerformanceTrendMonth[]
}

export interface PerformanceTrendResponse {
  success: boolean
  message: string
  data: PerformanceTrendData
}

// Revenue Views (Doanh thu và lượt xem)
export interface RevenueViewsValue {
  name: string
  value: number
}

export interface RevenueViewsMonth {
  tenThang: string
  values: RevenueViewsValue[]
}

export interface RevenueViewsData {
  title: string
  subtitle: string
  year: number
  months: RevenueViewsMonth[]
}

export interface RevenueViewsResponse {
  success: boolean
  message: string
  data: RevenueViewsData
}

// Chart data type for component
export interface ChartDataItem {
  name: string
  value: number
  color: string
  unit?: string
}

// --- 2. API Functions ---

export async function getTopEmployees(year?: number) {
  try {
    const res = await api.get<TopEmployeesResponse>('/admin/dashboard/top-employees', {
      params: year ? { year } : undefined,
    })
    return res.data.data
  } catch (error) {
    console.error('Fetch top employees failed', error)
    return null
  }
}

export async function getTopPerformanceMovies(year?: number) {
  try {
    const res = await api.get<TopPerformanceMoviesResponse>(
      '/admin/dashboard/top-performance-movies',
      {
        params: year ? { year } : undefined,
      }
    )
    return res.data.data
  } catch (error) {
    console.error('Fetch top performance movies failed', error)
    return null
  }
}

export async function getTopEffectiveCinemas(year?: number) {
  try {
    const res = await api.get<TopEffectiveCinemasResponse>(
      '/admin/dashboard/top-effective-cinemas',
      {
        params: year ? { year } : undefined,
      }
    )
    return res.data.data
  } catch (error) {
    console.error('Fetch top effective cinemas failed', error)
    return null
  }
}

export async function getPerformanceTrend(year?: number) {
  try {
    const res = await api.get<PerformanceTrendResponse>('/admin/performance/trend', {
      params: year ? { year } : undefined,
    })
    return res.data.data
  } catch (error) {
    console.error('Fetch performance trend failed', error)
    return null
  }
}

export async function getRevenueViews(year?: number) {
  try {
    const res = await api.get<RevenueViewsResponse>('/admin/revenue-views', {
      params: year ? { year } : undefined,
    })
    return res.data.data
  } catch (error) {
    console.error('Fetch revenue views failed', error)
    return null
  }
}

// --- 3. TanStack Query Hooks ---

export function useTopEmployees(year?: number) {
  return useQuery({
    queryKey: ['top-employees', year],
    queryFn: () => getTopEmployees(year),
    staleTime: 1000 * 60 * 5, // 5 phút
    enabled: !!year,
    refetchOnWindowFocus: false,
  })
}

export function useTopPerformanceMovies(year?: number) {
  return useQuery({
    queryKey: ['top-performance-movies', year],
    queryFn: () => getTopPerformanceMovies(year),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
    refetchOnWindowFocus: false,
  })
}

export function useTopEffectiveCinemas(year?: number) {
  return useQuery({
    queryKey: ['top-effective-cinemas', year],
    queryFn: () => getTopEffectiveCinemas(year),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
    refetchOnWindowFocus: false,
  })
}

export function usePerformanceTrend(year?: number) {
  return useQuery({
    queryKey: ['performance-trend', year],
    queryFn: () => getPerformanceTrend(year),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
    refetchOnWindowFocus: false,
  })
}

export function useRevenueViews(year?: number) {
  return useQuery({
    queryKey: ['revenue-views', year],
    queryFn: () => getRevenueViews(year),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
    refetchOnWindowFocus: false,
  })
}

// --- 4. Helper function to transform API data to chart format ---

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
]

export function transformToChartData(
  items: TopEmployeeItem[] | TopPerformanceMovieItem[] | TopEffectiveCinemaItem[],
  unit?: string
): ChartDataItem[] {
  return items.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: COLORS[index % COLORS.length],
    unit,
  }))
}
