'use client'
import {
  Product,
  ProductListResponse,
  ProductDetailResponse,
  ProductCreateDTO,
  ProductUpdateDTO,
} from '@/types/product'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import axios from 'axios' // Import axios để check isCancel

export interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  category?: 'Popcorn' | 'Drink' | 'Combo' | 'Snack'
  size?: 'S' | 'M' | 'L' | 'XL' | 'N/A'
  inStock?: boolean
  featured?: boolean
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

// GET /products - Lấy danh sách sản phẩm
// Thêm tham số signal
export async function getProducts(params: GetProductsParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<ProductListResponse>('/products', {
      headers: { 'Cache-Control': 'no-store' },
      params: params,
      signal, // 🟢 Truyền signal vào config của axios
    })
    return res.data.data
  } catch (error) {
    // 🟢 Nếu request bị cancel, throw error để React Query biết
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Failed to fetch products', error)
    return null
  }
}

// GET /products/{id} - Chi tiết sản phẩm
export async function getProductDetail(id: string, signal?: AbortSignal): Promise<Product> {
  if (!id) throw new Error('Product ID is required')

  try {
    const res = await api.get<ProductDetailResponse>(`/products/${id}`, {
      headers: { 'Cache-Control': 'no-store' },
      signal, // 🟢 Truyền signal
    })
    return res.data.data
  } catch (error) {
    // 🟢 Check cancel
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Failed to fetch product detail', error)
    throw new Error('Failed to fetch product detail')
  }
}

// React Query Hooks
export function useProducts(params: GetProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    // 🟢 Lấy signal từ context và truyền vào hàm fetch
    queryFn: ({ signal }) => getProducts(params, signal),
    staleTime: 1000 * 60 * 10,
    retry: 2,
    placeholderData: previousData => previousData,
  })
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ['productDetail', id],
    // 🟢 Lấy signal từ context
    queryFn: ({ signal }) => getProductDetail(id, signal),
    staleTime: 1000 * 60 * 10,
    retry: 2,
    enabled: !!id,
  })
}

// --- Mutations (Thường không cần signal vì ta muốn nó hoàn thành) ---

// POST /admin/products - Tạo sản phẩm (Admin)
export async function createProduct(data: ProductCreateDTO) {
  const res = await api.post('/admin/products', data)
  return res.data
}

// PUT /admin/products/{id} - Cập nhật sản phẩm (Admin)
export async function updateProduct(id: string, data: ProductUpdateDTO) {
  const res = await api.put(`/admin/products/${id}`, data)
  return res.data
}

// DELETE /admin/products/{id} - Xóa sản phẩm (Admin)
export async function deleteProduct(id: string) {
  const res = await api.delete(`/admin/products/${id}`)
  return res.data
}

// POST /admin/products/{productId}/upload-image - Upload ảnh sản phẩm
export async function uploadProductImage(productId: string, imageFile: File) {
  const formData = new FormData()
  formData.append('image', imageFile)

  const res = await api.post(`/admin/products/${productId}/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}
