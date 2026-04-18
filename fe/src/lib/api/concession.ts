import { api } from '@/lib/api/axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse } from '@/types/apiTemplate'

// ==========================================
// TYPES
// ==========================================

export interface ConcessionProduct {
  productId: string
  quantity: number
  size?: string
}

export interface ConcessionCustomerInfo {
  fullName: string
  phone: string
  email?: string
}

export interface CreateConcessionRequest {
  products: ConcessionProduct[]
  customerInfo: ConcessionCustomerInfo
  voucherCode?: string
  paymentMethod: 'cash' | 'card' | 'momo' | 'zalopay'
}

export interface CreateConcessionResponse {
  success: boolean
  message: string
  data: {
    concessionId: string
    totalAmount: number
    discount: number
    finalAmount: number
    products: Array<{
      productId: string
      name: string
      quantity: number
      price: number
      subtotal: number
    }>
    customerInfo: ConcessionCustomerInfo
    paymentMethod: string
    createdAt: string
  }
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * POST /staff/concession - Tạo đơn hàng bắp nước (Concession)
 */
export async function createConcession(
  data: CreateConcessionRequest
): Promise<CreateConcessionResponse> {
  const response = await api.post<CreateConcessionResponse>('/staff/concession', data)
  return response.data
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================

export function useCreateConcession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createConcession,
    onSuccess: data => {
      // Invalidate products query to update stock
      queryClient.invalidateQueries({ queryKey: ['products'] })

    },
    onError: (error: any) => {
      console.error('❌ Lỗi khi tạo đơn hàng:', error.response?.data?.message || error.message)
    },
  })
}
