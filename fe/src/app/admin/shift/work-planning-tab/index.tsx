'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns'

// Imports Components con
import PlanningToolbar from './planning-toolbar'
import PlanningCalendar from './planning-calendar'
// Imports Modals & API
import GenerateScheduleModal from '../components/modals/generate-schedule-modal'
import ConfirmDeleteAlert from '../components/modals/confirm-delete-alert'
import { useWorkSchedules, useWorkScheduleMutations } from '@/lib/api/work-schedules'
import { WorkSchedule, DayWorkSchedule } from '@/types/work-schedule'
import { useTheaters } from '@/lib/api/theaters'

export default function WorkPlanningTab() {
  const { data: theaters } = useTheaters({ limit: 100 })
  const { remove } = useWorkScheduleMutations()
  const [isGenerateOpen, setGenerateOpen] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  // State Filter - khởi tạo với empty string
  const [selectedTheaterId, setSelectedTheaterId] = useState<string>('')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Set theater đầu tiên khi data load xong
  useEffect(() => {
    if (theaters?.theaters && theaters.theaters.length > 0 && !selectedTheaterId) {
      setSelectedTheaterId(theaters.theaters[0]._id)
    }
  }, [theaters, selectedTheaterId])

  // --- 2. Tính toán ngày tháng (useMemo) ---
  const { monthStart, calendarDays, apiFromDate, apiToDate } = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

    return {
      monthStart,
      calendarDays,
      apiFromDate: format(startDate, 'yyyy-MM-dd'),
      apiToDate: format(endDate, 'yyyy-MM-dd'),
    }
  }, [currentDate])

  // Chỉ fetch khi đã có theaterId
  const { data: schedulesResponse, isLoading } = useWorkSchedules({
    theaterId: selectedTheaterId,
    from: apiFromDate,
    to: apiToDate,
  })

  // --- 4. Transform data (Container xử lý logic này) ---
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, WorkSchedule[]>()
    if (schedulesResponse) {
      schedulesResponse.forEach((daySchedule: DayWorkSchedule) => {
        map.set(daySchedule.date, daySchedule.shifts)
      })
    }
    return map
  }, [schedulesResponse])

  // --- 5. Handlers ---
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1))
  }, [])

  const handleDeleteClick = useCallback((id: string) => {
    setSelectedScheduleId(id)
    setDeleteAlertOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (selectedScheduleId) {
      await remove.mutateAsync(selectedScheduleId)
      setDeleteAlertOpen(false)
      setSelectedScheduleId(null)
    }
  }, [selectedScheduleId, remove])

  return (
    <div className="space-y-6">
      {/* 1. Toolbar Component */}
      <PlanningToolbar
        theaters={theaters?.theaters}
        selectedTheaterId={selectedTheaterId}
        onTheaterChange={setSelectedTheaterId}
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGenerate={() => setGenerateOpen(true)}
      />

      {/* 2. Calendar Component */}
      <PlanningCalendar
        isLoading={isLoading}
        calendarDays={calendarDays}
        monthStart={monthStart}
        schedulesByDate={schedulesByDate}
        onDeleteShift={handleDeleteClick}
      />

      {/* 3. Modals (Giữ ở container để không làm rối UI component) */}
      <GenerateScheduleModal open={isGenerateOpen} onOpenChange={setGenerateOpen} />

      <ConfirmDeleteAlert
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={handleConfirmDelete}
        isLoading={remove.isPending}
      />
    </div>
  )
}
