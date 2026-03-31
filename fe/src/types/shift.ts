import type { ApiResponse } from './apiTemplate'
export interface ShiftTemplate {
  _id: string
  code: string
  name: string // VD: Ca Sáng
  startTime: string // 08:00
  endTime: string // 16:00
  color: string // Để hiển thị trên lịch
  isActive: boolean
}

export interface WorkSchedule {
  id: string
  date: string // 2025-12-01
  theaterId: string
  shiftTemplateId: string
  shiftTemplate?: ShiftTemplate // Relation
  status: 'Open' | 'Closed'
}

export interface ShiftAssignment {
  id: string
  workScheduleId: string
  userId: string
  userName: string
  role: string
  checkInTime?: string
  checkOutTime?: string
  status: 'Assigned' | 'Working' | 'Completed' | 'Absent'
}

export type ShiftTemplateResponse = ApiResponse<ShiftTemplate[]>
export interface AssignedEmployee {
  notes: any
  _id: string
  role: string
  shiftTemplateId: string
  theaterId: string
  theaterName: string
  workScheduleId: string
  shiftName: string
  shiftCode: string
  startTime: string
  assignmentId?: string
  endTime: string
  color?: string
  status: string
  checkInTime?: string // ISO string
  checkOutTime?: string // ISO string
  assignedAt: string // ISO string
  date: string
  startDateTime: string
  endDateTime: string
  fullName?: string;
  email?: string;
  avatar?: string;
}
// Shift with Employees
export interface ShiftWithEmployees {
  scheduleId: string
  date: string // YYYY-MM-DD
  shift: ShiftTemplate
  startDateTime: string // ISO
  endDateTime: string // ISO
  status: 'open' | 'closed'
  employees: AssignedEmployee[]
  totalEmployees: number
}

// Daily Roster Response
export interface DailyRosterData {
  date: string
  shifts: ShiftWithEmployees[]
  summary: {
    totalSchedules: number
    totalAssignments: number
    activeNow: number
    completed: number
    pending: number
    noShow: number
  }
}

export type DailyRosterResponse = ApiResponse<DailyRosterData>

// DTO for Create Assignment
export interface CreateAssignmentDTO {
  workScheduleId: string
  userId: string
  role: string
}

// DTO for Update Assignment
export interface UpdateAssignmentDTO {
  role?: string
  checkInTime?: string
  checkOutTime?: string
  status?: 'assigned' | 'working' | 'completed' | 'absent'
}

// Get Daily Roster Params
export interface GetDailyRosterParams {
  theaterId: string
  date: string // YYYY-MM-DD
  shiftCode?: string // S1, S2, S3 (optional filter)
}
export interface BulkAssignmentDTO {
  theaterId: string
  assignments: CreateAssignmentDTO[]
}

export interface CreateAssignmentDTO {
  workScheduleId: string
  userId: string
  role: string
}
