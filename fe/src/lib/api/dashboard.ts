import { api } from '@/lib/api/axios'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// --- 1. Existing Types ---
export interface DashboardCard {
  title: string
  value: number
  subLabel: string
  description: string
  icon?: string
}

export interface DashboardSummary {
  cards: DashboardCard[]
}

export interface DashboardSummaryResponse {
  success: boolean
  data: DashboardSummary
  message?: string
}

// Top Movies Response
export interface TopMovieItem {
  name: string
  value: number
}

export interface TopMoviesData {
  title: string
  subtitle: string
  year: number
  items: TopMovieItem[]
}

export interface TopMoviesResponse {
  success: boolean
  message: string
  data: TopMoviesData
}

// Top Cinemas Response
export interface TopCinemaItem {
  name: string
  value: number
}

export interface TopCinemasData {
  title: string
  subtitle: string
  year: number
  items: TopCinemaItem[]
}

export interface TopCinemasResponse {
  success: boolean
  message: string
  data: TopCinemasData
}

// Employee KPI Response
export interface EmployeeKPIData {
  period: string
  month: number
  year: number
  staffId: string
  message: string
  kpiData: {
    kpi: number
    completion: number
    shifts: number
    performance: number
  } | null
}

export interface EmployeeKPIResponse {
  success: boolean
  message: string
  data: EmployeeKPIData
}

// Employee KPI Params
export interface EmployeeKPIParams {
  employeeId: string
  month?: number
  year?: number
}

// Employee Comparison Types
export interface EmployeeStats {
  Sales: number
  Service: number
  Operations: number
  Attendance: number
  Quality: number
}

export interface EmployeeComparison {
  staffId: string
  staffName: string
  stats: EmployeeStats
}

export interface EmployeeComparisonData {
  comparison: EmployeeComparison[]
}

export interface EmployeeComparisonResponse {
  success: boolean
  data: EmployeeComparisonData
}

export interface EmployeeComparisonParams {
  employeeIds: string[]
  month?: number
  year?: number
}

// 🆕 Product Sales Types
export interface ProductSalesValue {
  name: string
  value: number
}

export interface ProductSalesMonth {
  tenThang: string
  values: ProductSalesValue[]
}

export interface ProductSalesData {
  title: string
  subTitle: string
  year: number
  months: ProductSalesMonth[]
}

export interface ProductSalesResponse {
  success: boolean
  message: string
  data: ProductSalesData
}

export interface ProductSalesParams {
  year?: number
  theater?: string
}

// Chart data type for component
export interface ChartDataItem {
  name: string
  value: number
  color: string
  unit?: string
}

// --- 2. API Functions ---

export async function getDashboardSummary(signal?: AbortSignal) {
  try {
    const res = await api.get<DashboardSummaryResponse>('/admin/dashboard/sumary-overview', {
      signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch dashboard summary failed', error)
    return null
  }
}

export async function getTopMovies(year?: number, signal?: AbortSignal) {
  try {
    const res = await api.get<TopMoviesResponse>('/admin/dashboard/top-movies', {
      params: year ? { year } : undefined,
      signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch top movies failed', error)
    return null
  }
}

export async function getTopCinemas(year?: number, signal?: AbortSignal) {
  try {
    const res = await api.get<TopCinemasResponse>('/admin/dashboard/top-cinemas', {
      params: year ? { year } : undefined,
      signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch top cinemas failed', error)
    return null
  }
}

export async function getEmployeeKPI(params: EmployeeKPIParams, signal?: AbortSignal) {
  try {
    const queryParams: Record<string, string | number> = {
      employeeId: params.employeeId,
    }

    if (params.month) {
      queryParams.month = params.month
    }

    if (params.year) {
      queryParams.year = params.year
    }

    const res = await api.get<EmployeeKPIResponse>('/admin/employee/kpi', {
      params: queryParams,
      signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch employee KPI failed', error)
    return undefined
  }
}

export async function getEmployeeComparison(
  params: EmployeeComparisonParams,
  signal?: AbortSignal
) {
  try {
    const queryParams: Record<string, string | number> = {
      employeeIds: params.employeeIds.join(','),
    }

    if (params.month) {
      queryParams.month = params.month
    }

    if (params.year) {
      queryParams.year = params.year
    }

    const res = await api.get<EmployeeComparisonResponse>('/admin/performance/compare', {
      params: queryParams,
      signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch employee comparison failed', error)
    return null
  }
}

// 🆕 Get Product Sales Statistics
export async function getProductSales(params: ProductSalesParams = {}, signal?: AbortSignal) {
  try {
    const queryParams: Record<string, string | number> = {}

    if (params.year) {
      queryParams.year = params.year
    }

    if (params.theater) {
      queryParams.theater = params.theater
    }

    const res = await api.get<ProductSalesResponse>('/dashboard/product-sales', {
      params: queryParams,
      signal,
    })

    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Fetch product sales failed', error)
    return null
  }
}

// --- 3. TanStack Query Hooks ---

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: ({ signal }) => getDashboardSummary(signal),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useTopMovies(year?: number) {
  return useQuery({
    queryKey: ['top-movies', year],
    queryFn: ({ signal }) => getTopMovies(year, signal),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
  })
}

export function useTopCinemas(year?: number) {
  return useQuery({
    queryKey: ['top-cinemas', year],
    queryFn: ({ signal }) => getTopCinemas(year, signal),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
  })
}

export function useEmployeeKPI(params: EmployeeKPIParams | undefined) {
  return useQuery({
    queryKey: ['employee-kpi', params?.employeeId, params?.month, params?.year],
    queryFn: ({ signal }) => getEmployeeKPI(params!, signal),
    staleTime: 1000 * 60 * 2,
    enabled: !!params?.employeeId,
  })
}

export function useEmployeeComparison(params: EmployeeComparisonParams | null) {
  return useQuery({
    queryKey: ['employee-comparison', params?.employeeIds, params?.month, params?.year],
    queryFn: ({ signal }) => getEmployeeComparison(params!, signal),
    staleTime: 1000 * 60 * 2,
    enabled: !!params && params.employeeIds.length > 0,
  })
}

// 🆕 Product Sales Hook
export function useProductSales(params: ProductSalesParams = {}) {
  return useQuery({
    queryKey: ['product-sales', params.year, params.theater],
    queryFn: ({ signal }) => getProductSales(params, signal),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!params.year, // Only fetch when year is provided
  })
}

// --- 4. Helper functions ---

const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']

export function transformToChartData(
  items: TopMovieItem[] | TopCinemaItem[],
  unit?: string
): ChartDataItem[] {
  return items.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: COLORS[index % COLORS.length],
    unit,
  }))
}

// 🆕 Transform product sales data for charts
export function transformProductSalesForChart(data: ProductSalesData | null) {
  if (!data || !data.months) return []

  return data.months.map(month => {
    const revenue = month.values.find(v => v.name.includes('Doanh thu'))?.value || 0
    const quantity = month.values.find(v => v.name.includes('Số lượng'))?.value || 0

    return {
      month: month.tenThang,
      revenue: revenue,
      quantity: quantity,
    }
  })
}

// 🆕 Calculate totals from product sales data
export function calculateProductSalesTotals(data: ProductSalesData | null) {
  if (!data || !data.months) {
    return {
      totalRevenue: 0,
      totalQuantity: 0,
      avgRevenue: 0,
      avgQuantity: 0,
    }
  }

  let totalRevenue = 0
  let totalQuantity = 0

  data.months.forEach(month => {
    const revenue = month.values.find(v => v.name.includes('Doanh thu'))?.value || 0
    const quantity = month.values.find(v => v.name.includes('Số lượng'))?.value || 0

    totalRevenue += revenue
    totalQuantity += quantity
  })

  return {
    totalRevenue,
    totalQuantity,
    avgRevenue: totalRevenue / 12,
    avgQuantity: totalQuantity / 12,
  }
}
