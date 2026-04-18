import { Movie } from './movie'
import type { ApiResponse } from './apiTemplate'
import { Pagination } from './apiTemplate'
// ======================
// GENRE INTERFACE
// ======================
export interface Genre {
  _id: string

  name: string
  slug?: string

  description?: string
  icon?: string
  color?: string
  displayOrder: number

  isActive: boolean

  createdAt?: string | Date
  updatedAt?: string | Date

  // Virtuals
  movies?: Movie[]
  movieCount?: number
}

export interface GenreListData {
  items: Genre[]
  pagination: Pagination
}

export type GenreApiResponse = ApiResponse<Genre>
export type GenreListResponse = ApiResponse<GenreListData>
