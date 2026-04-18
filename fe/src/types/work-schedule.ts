// types/work-schedule.ts
import { ApiResponse } from './apiTemplate'
// 1. Sub-types cho các field populated
export interface TheaterShort {
  _id: string
  name: string
}

export interface ShiftTemplateShort {
  _id: string
  name: string
  startTime: string // VD: "06:00"
  endTime: string // VD: "11:00"
}

// 2. Main Entity: WorkSchedule (Dựa trên JSON response)
export interface WorkSchedule {
  _id: string
  date: string // YYYY-MM-DD
  theaterId: TheaterShort
  shiftTemplateId: ShiftTemplateShort
  startDateTime: string // ISO String
  endDateTime: string // ISO String
  status: 'open' | 'closed' // Dựa trên JSON mẫu thấy "open"
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  startTime: string
  endTime: string
}

// 3. DTO cho API Generate (Dựa trên ảnh Swagger POST)
export interface GenerateWorkScheduleDTO {
  theaterId: string
  range: {
    from: string // YYYY-MM-DD
    to: string // YYYY-MM-DD
  }
  templateIds: string[]
  skipExisting?: boolean // Optional
}

// 4. Params cho API Get List (Dựa trên ảnh Swagger GET)
export interface GetWorkScheduleParams {
  theaterId?: string
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
}
export interface DayWorkSchedule {
  date: string
  shifts: WorkSchedule[]
}
export type WorkScheduleResponseData = ApiResponse<DayWorkSchedule[]>
