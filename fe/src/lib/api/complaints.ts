'use client'
import {
  Complaint,
  ComplaintListResponse,
  ComplaintDetailResponse,
  ComplaintCreateDTO,
  ComplaintUpdateStatusDTO,
  ComplaintUpdateDTO,
  GetComplaintsParams,
} from '@/types/complaint'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import axios from 'axios'

// Get all complaints with filters
export async function getComplaints(params: GetComplaintsParams = {}, signal?: AbortSignal) {
  try {
    const res = await api.get<ComplaintListResponse>('/staff/complaints', {
      headers: { 'Cache-Control': 'no-store' },
      params: params,
      signal: signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Failed to fetch complaints', error)
    return {
      complaints: [],
      pagination: { currentPage: 0, totalPages: 0, totalItems: 0, itemsPerPage: 0 },
    }
  }
}

// Get complaint detail by ID (GET /staff/complaints/{id})
export async function getComplaintDetail(id: string, signal?: AbortSignal): Promise<Complaint> {
  if (!id) throw new Error('Complaint ID is required')

  try {
    const res = await api.get<ComplaintDetailResponse>(`/staff/complaints/${id}`, {
      headers: { 'Cache-Control': 'no-store' },
      signal: signal,
    })
    return res.data.data
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error
    }
    console.error('Failed to fetch complaint detail', error)
    throw new Error('Failed to fetch complaint detail')
  }
}

// React Query hooks
export function useComplaints(params: GetComplaintsParams) {
  return useQuery({
    queryKey: ['complaints', params],
    queryFn: ({ signal }) => getComplaints(params, signal),
    staleTime: 1000 * 60 * 5, // 5 phút
    retry: 2,
    placeholderData: previousData => previousData,
  })
}

export function useComplaintDetail(id: string) {
  return useQuery({
    queryKey: ['complaintDetail', id],
    queryFn: ({ signal }) => getComplaintDetail(id, signal),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: !!id,
  })
}

// --- Mutation Functions ---

// Create complaint (POST /staff/complaints)
// Body: { customerId?: string, category: string, description: string, priority: string }
export async function createComplaint(data: ComplaintCreateDTO) {
  const res = await api.post('/staff/complaints', data)
  return res.data
}

// Update complaint status (PUT /staff/complaints/{id}/status)
// Body: { status: string, note?: string }
export async function updateComplaintStatus(id: string, data: ComplaintUpdateStatusDTO) {
  const res = await api.put(`/staff/complaints/${id}/status`, data)
  return res.data
}

// Update complaint info (PUT /staff/complaints/{id}) - nếu API có hỗ trợ
export async function updateComplaint(id: string, data: ComplaintUpdateDTO) {
  const res = await api.put(`/staff/complaints/${id}`, data)
  return res.data
}

// Delete complaint (DELETE /staff/complaints/{id}) - nếu API có hỗ trợ
export async function deleteComplaint(id: string) {
  const res = await api.delete(`/staff/complaints/${id}`)
  return res.data
}

// Upload attachments - nếu API có hỗ trợ
export async function uploadComplaintAttachment(complaintId: string, file: File) {
  const formData = new FormData()
  formData.append('attachment', file)

  const res = await api.post(`/staff/complaints/${complaintId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return res.data
}

// Assign complaint to staff - nếu API có hỗ trợ
export async function assignComplaint(complaintId: string, staffId: string) {
  const res = await api.put(`/staff/complaints/${complaintId}/assign`, { staffId })
  return res.data
}

// Escalate complaint - nếu API có hỗ trợ
export async function escalateComplaint(
  complaintId: string,
  data: { escalatedTo: string; note: string }
) {
  const res = await api.put(`/staff/complaints/${complaintId}/escalate`, data)
  return res.data
}
