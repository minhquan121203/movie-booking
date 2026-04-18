import { api } from '@/lib/api/axios'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// ==========================================
// PRODUCT SALES TYPES
// ==========================================

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

// ==========================================
// API FUNCTION
// ==========================================

/**
 * GET /dashboard/product-sales - Thống kê sản phẩm bán được
 * @param params - year và theater (optional)
 * @param signal - AbortSignal for cancellation
 */
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

// ==========================================
// REACT QUERY HOOK
// ==========================================

export function useProductSales(params: ProductSalesParams = {}) {
  return useQuery({
    queryKey: ['product-sales', params.year, params.theater],
    queryFn: ({ signal }) => getProductSales(params, signal),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!params.year, // Only fetch when year is provided
  })
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Transform API data for chart display
 */
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

/**
 * Calculate totals from product sales data
 */
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
