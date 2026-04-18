import { BookingListResponse, BookingStatus, Booking } from '@/types/booking'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import { ApiResponse } from '@/types/apiTemplate'
import {
  CreateBookingRequest,
  CreateBookingResponse,
  CreateStaffBookingRequest,
  TicketVerify,
} from '@/types/booking'

export interface GetBookingParams {
  page?: string
  status?: string
}

export async function getBookings(params: GetBookingParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<BookingListResponse>('/bookings/my-bookings', {
      params,
      signal: signal,
    })
    return res.data.data
  } catch (error) {
    console.error('Failed to fetch bookings', error)
    return {
      bookings: [],
      pagination: {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 0,
      },
    }
  }
}

export function useBookings(params: GetBookingParams = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: ({ signal }) => getBookings(params, signal),
    staleTime: 1000 * 60 * 10,
    retry: 2,
  })
}

export interface GetMyBookingParams {
  page?: number
  limit?: number
  status?: string
}

export async function getMyBookings(params: GetMyBookingParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<BookingListResponse>('/bookings/my-bookings', {
      params,
      signal: signal,
    })
    return res.data.data
  } catch (error) {
    console.error('Failed to fetch bookings', error)
    return {
      bookings: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    }
  }
}

export function useMyBookings(params: GetMyBookingParams = {}) {
  return useQuery({
    queryKey: ['my-bookings', params],
    queryFn: ({ signal }) => getMyBookings(params, signal),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

// Get booking by bookingCode (public API - no auth required)
export async function getBookingByCode(bookingCode: string, signal?: AbortSignal) {
  try {
    const res = await api.get<ApiResponse<TicketVerify>>(`/staff/tickets/check/${bookingCode}`, {
      signal: signal,
    })
    return res.data.data
  } catch (error: any) {
    console.error('Failed to fetch booking by code', error)
    throw new Error(error.response?.data?.message || 'Không tìm thấy vé')
  }
}

export function useBookingByCode(bookingCode: string | null) {
  return useQuery({
    queryKey: ['booking-by-code', bookingCode],
    queryFn: ({ signal }) => getBookingByCode(bookingCode!, signal),
    enabled: !!bookingCode,
    retry: false,
  })
}

export const createBookingApi = async (
  data: CreateBookingRequest
): Promise<CreateBookingResponse> => {
  const response = await api.post<CreateBookingResponse>('/bookings', data)
  return response.data
}

export const createStaffBookingApi = async (
  data: CreateStaffBookingRequest
): Promise<CreateBookingResponse> => {
  const response = await api.post<CreateBookingResponse>('/staff/bookings', data)
  return response.data
}

export interface GetAdminBookingsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  showDate?: string
}

export async function getAdminBookings(params: GetAdminBookingsParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<BookingListResponse>('/admin/bookings', { params, signal: signal })
    return res.data.data
  } catch (error) {
    console.error('Fetch bookings failed', error)
    return {
      bookings: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    }
  }
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const res = await api.put(`/admin/bookings/${id}/status`, { status })
  return res.data
}

export async function deleteBooking(id: string) {
  const res = await api.delete(`/admin/bookings/${id}`)
  return res.data
}

export function useAdminBookings(params: GetAdminBookingsParams) {
  return useQuery({
    queryKey: ['admin-bookings', params],
    queryFn: ({ signal }) => getAdminBookings(params, signal),
    staleTime: 1000 * 60 * 2,
    placeholderData: previousData => previousData,
  })
}

export async function getBookingDetail(id: string) {
  try {
    const res = await api.get<ApiResponse<Booking>>(`/bookings/${id}`)
    return res.data.data
  } catch (error) {
    console.error('Failed to fetch booking detail', error)
    return null
  }
}

export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: ['booking-detail', id],
    queryFn: () => getBookingDetail(id),
    enabled: !!id,
  })
}
export async function validateTicket(bookingCode: string) {
  const res = await api.post('/staff/tickets/validate-code', {
    bookingCode,
  })
  return res.data
}
