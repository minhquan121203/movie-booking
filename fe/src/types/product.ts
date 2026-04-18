import type { ApiResponse, Pagination } from './apiTemplate'

// ======================
// COMBO ITEM INTERFACE
// ======================
export interface ComboItem {
  product: string | Product // ObjectId reference hoặc populated Product
  quantity: number
}

// ======================
// PRODUCT INTERFACE
// ======================
export interface Product {
  _id: string

  // Basic information
  name: string
  slug: string
  description?: string

  // Category
  category: 'Popcorn' | 'Drink' | 'Combo' | 'Snack'

  // Pricing
  price: number
  originalPrice?: number
  discount: number // 0 – 100 %
  discountedPrice?: number // virtual
  discountAmount?: number // virtual

  // Media
  imageUrl?: string
  imagePublicId?: string

  // Size
  size: 'S' | 'M' | 'L' | 'XL' | 'N/A'

  // Inventory
  inStock: boolean
  stockQuantity: number
  lowStockThreshold: number
  isLowStock?: boolean // virtual

  // Combo (only if category === "Combo")
  comboItems?: ComboItem[]

  // Nutrition
  calories?: number
  allergens?: string[]

  // Sales statistics
  totalSold: number
  totalRevenue: number

  // SEO / marketing
  featured: boolean
  tags?: string[]

  // Active status
  isActive: boolean

  // Audit fields
  createdBy?: string // UserId
  updatedBy?: string // UserId

  createdAt: string | Date
  updatedAt: string | Date

  __v?: number
}

// ======================
// PRODUCT DTOs
// ======================
export interface ProductCreateDTO {
  name: string
  slug: string
  description?: string
  category: 'Popcorn' | 'Drink' | 'Combo' | 'Snack'
  price: number
  originalPrice?: number
  discount?: number
  imageUrl?: string
  size?: 'S' | 'M' | 'L' | 'XL' | 'N/A'
  inStock?: boolean
  stockQuantity?: number
  lowStockThreshold?: number
  comboItems?: ComboItem[]
  calories?: number
  allergens?: string[]
  featured?: boolean
  tags?: string[]
  isActive?: boolean
}

export type ProductUpdateDTO = ProductCreateDTO

export type ProductListResponse = ApiResponse<Product[]>
export type ProductDetailResponse = ApiResponse<Product>
