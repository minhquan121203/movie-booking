import { MovieListData, Movie } from '@/types/movie'
import { PaginatedTheaterResponse } from '@/types/theater'
import { PaginatedReviewData } from '@/types/review'
import { PaginatedScheduleData } from '@/types/schedule'
import { PaginatedBookingData } from '@/types/booking'
import { GenreListData } from '@/types/genre'

export const DEFAULT_MOVIE_LIST: MovieListData = {
  movies: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
}
export const DEFAULT_MOVIE_DETAIL: Movie = {
  _id: '',
  title: 'Không có dữ liệu',
  slug: '',
  rating: 'P',
  duration: 0,
  genres: [],
  viewCount: 0,
  averageRating: 0,
  totalReviews: 0,
  totalRevenue: 0,
  status: 'Sắp chiếu',
  releaseDate: '',
}
export const DEFAULT_THEATER_LIST: PaginatedTheaterResponse = {
  theaters: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
}
export const DEFAULT_GENRE_LIST: GenreListData = {
  items: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
}
export const DEFAULT_REVIEW_LIST: PaginatedReviewData = {
  reviews: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
  statistics: {
    avgRating: 0,
    totalReviews: 0,
  },
}
export const DEFAULT_SCHEDULE_LIST: PaginatedScheduleData = {
  schedules: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
}
export const DEFAULT_BOOKING_LIST: PaginatedBookingData = {
  bookings: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
}
export const DEFAULT_REVIEWS_LIST: PaginatedReviewData = {
  reviews: [],
  pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
  statistics: {
    avgRating: 0,
    totalReviews: 0,
  },
}
export const MAXSTARS = 5
