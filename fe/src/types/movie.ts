import type { ApiResponse } from './apiTemplate'
import type { Pagination } from './apiTemplate'
import { Genre } from './genre'
// ======================
// MOVIE INTERFACE
// ======================
export interface Movie {
  _id: string

  title: string
  slug: string

  director?: string
  actors?: string[]

  duration: number
  description?: string

  posterUrl?: string
  posterPublicId?: string

  trailerUrl: string

  rating: 'P' | 'C13' | 'C16' | 'C18'

  releaseDate: string | Date

  status: 'Sắp chiếu' | 'Đang chiếu' | 'Ngừng chiếu'

  /** Danh sách ObjectId của genre */
  genres: Genre[]

  language?: string
  subtitles?: string[]
  country?: string

  ageRestriction?: number

  // Statistics
  viewCount: number
  averageRating: number
  totalReviews: number
  totalRevenue: number

  // SEO
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]

  // Audit
  createdBy?: string
  updatedBy?: string

  isDeleted?: boolean

  createdAt?: string | Date
  updatedAt?: string | Date
}

// ======================
// MOVIE WITH POPULATED GENRES
// ======================
export interface MovieWithGenres extends Omit<Movie, 'genres'> {
  /** Khi BE populate thể loại */
  genres: Genre[]
}

export interface MovieCreateDTO {
  title: string
  director?: string
  actors?: string[]
  duration: number
  description?: string
  posterUrl?: string
  trailerUrl?: string
  rating: 'P' | 'C13' | 'C16' | 'C18'
  releaseDate: string | Date
  status?: 'Sắp chiếu' | 'Đang chiếu' | 'Ngừng chiếu'
  genres: string[]
  language?: string
  subtitles?: string[]
  country?: string
  ageRestriction?: number
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
}

export interface MovieUpdateDTO extends Partial<MovieCreateDTO> {
  isDeleted?: boolean
}
export interface MovieListData {
  movies: Movie[]
  pagination: Pagination
}
export type MovieListResponse = ApiResponse<MovieListData>
export type MovieDetailResponse = ApiResponse<Movie>
