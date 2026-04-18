// Complaint Types
export interface TimelineItem {
  action: string
  performedBy: string
  performedByName: string
  note?: string
  timestamp: string
  _id: string
}

export interface Complaint {
  _id: string
  complaintId: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  bookingCode?: string
  theater: string
  theaterName: string
  category: 'service' | 'facility' | 'product' | 'booking' | 'technical' | 'other'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'escalated'
  receivedBy: string
  receivedByName: string
  compensationType: 'none' | 'refund' | 'voucher' | 'free_ticket' | 'other'
  compensationAmount?: number
  compensationNote?: string
  attachments: string[]
  isEscalated: boolean
  escalatedTo?: string
  escalatedToName?: string
  timeline: TimelineItem[]
  createdAt: string
  updatedAt: string
  __v: number
}

export interface ComplaintListResponse {
  success: boolean
  message: string
  data: {
    complaints: Complaint[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface ComplaintDetailResponse {
  success: boolean
  message: string
  data: Complaint
}

// Create Complaint DTO (theo POST /staff/complaints)
export interface ComplaintCreateDTO {
  customerId?: string
  category: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

// Update Complaint Status DTO (theo PUT /staff/complaints/{id}/status)
export interface ComplaintUpdateStatusDTO {
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'escalated'
  note?: string
}

// Update Complaint DTO (nếu có endpoint PUT /staff/complaints/{id})
export interface ComplaintUpdateDTO {
  category?: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  compensationType?: string
  compensationAmount?: number
  compensationNote?: string
  isEscalated?: boolean
  escalatedTo?: string
}

// Query Params
export interface GetComplaintsParams {
  page?: number
  limit?: number
  status?: string
  category?: string
  priority?: string
  theater?: string
  customerId?: string
  isEscalated?: boolean
  search?: string
  sortBy?: string
  order?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}
