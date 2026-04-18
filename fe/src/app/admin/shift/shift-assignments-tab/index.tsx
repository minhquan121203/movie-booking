// app/(admin)/shift-manager/components/shift-assignments-tab.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

// Components
import AssignmentFilters from './assignment-filters'
import AssignmentStats from './assignment-stats'
import ShiftsList from './shifts-list'
import AssignStaffModal from '../components/modals/assign-staff-modal'
import UpdateAssignmentModal from '../components/modals/update-assignment-modal'
import ConfirmDeleteAlert from '../components/modals/confirm-delete-alert'

// API & Types
import { useDailyRoster, useAssignmentMutations } from '@/lib/api/shift-assignments'
import { useShiftTemplates } from '@/lib/api/shift-templates'
import { AssignedEmployee, ShiftWithEmployees } from '@/types/shift'
import { useTheaters } from '@/lib/api/theaters'

export default function ShiftAssignmentsTab() {
  // --- API Hooks (Fetch theaters first) ---
  const { data: theatersData } = useTheaters({ limit: 100 })
  const { data: shiftTemplatesData } = useShiftTemplates({ isActive: true })
  const { remove } = useAssignmentMutations()

  const theaters = useMemo(() => theatersData?.theaters || [], [theatersData])
  const shiftTemplates = useMemo(() => shiftTemplatesData || [], [shiftTemplatesData])

  // Initialize selectedTheaterId with first theater (derived state)
  const defaultTheaterId = useMemo(() => {
    return theaters.length > 0 ? theaters[0]._id : ''
  }, [theaters])

  // --- States ---
  const [selectedTheaterId, setSelectedTheaterId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedShiftCode, setSelectedShiftCode] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Use defaultTheaterId if selectedTheaterId is empty
  const activeTheaterId = selectedTheaterId || defaultTheaterId

  // Modal States
  const [isAssignOpen, setAssignOpen] = useState(false)
  const [isUpdateOpen, setUpdateOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  const [selectedSchedule, setSelectedSchedule] = useState<ShiftWithEmployees | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<AssignedEmployee | null>(null)

  // Only fetch roster when we have a valid theater ID
  const { data: rostersData, isLoading } = useDailyRoster({
    theaterId: activeTheaterId,
    date: selectedDate,
    shiftCode: selectedShiftCode === 'all' ? undefined : selectedShiftCode,
  })
  console.log(rostersData)
  // --- Computed Data ---
  const { shifts, summary } = useMemo(() => {
    if (!rostersData) {
      return { shifts: [], summary: null }
    }

    const shifts = rostersData.shifts
    const summary = rostersData.summary

    return { shifts, summary }
  }, [rostersData])

  // Get available shift codes from templates (for filter dropdown)
  const availableShiftCodes = useMemo(() => {
    if (!shiftTemplates || shiftTemplates.length === 0) return []
    const codes = new Set(shiftTemplates.map(t => t.code))
    return Array.from(codes).sort()
  }, [shiftTemplates])

  // --- Filter shifts by search query ---
  const filteredShifts = useMemo(() => {
    if (!searchQuery) return shifts

    return shifts
      .map(shift => ({
        ...shift,
        employees: shift.employees.filter(emp =>
          emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(shift => shift.employees.length > 0)
  }, [shifts, searchQuery])

  // --- Handlers ---
  const handleTheaterChange = useCallback((value: string) => {
    setSelectedTheaterId(value)
  }, [])

  const handleDateChange = useCallback((value: string) => {
    setSelectedDate(value)
  }, [])

  const handleShiftCodeChange = useCallback((value: string) => {
    setSelectedShiftCode(value)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleAssignNew = useCallback((shift: ShiftWithEmployees) => {
    setSelectedSchedule(shift)
    setAssignOpen(true)
  }, [])

  const handleEdit = useCallback((employee: AssignedEmployee) => {
    setSelectedEmployee(employee)
    setUpdateOpen(true)
  }, [])

  const handleDelete = useCallback((employee: AssignedEmployee) => {
    setSelectedEmployee(employee)
    setDeleteOpen(true)
  }, [])

  const handleConfirmRemove = useCallback(async () => {
    if (selectedEmployee?.assignmentId) {
      await remove.mutateAsync(selectedEmployee.assignmentId)
      setDeleteOpen(false)
      setSelectedEmployee(null)
    }
  }, [selectedEmployee, remove])

  // --- Render ---
  // Show loading state while waiting for theaters to load
  if (!activeTheaterId) {
    return (
      <div className="space-y-6">
        <Card className="p-4 rounded-2xl border-gray-100 shadow-sm bg-white">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">Đang tải dữ liệu...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AssignmentFilters
        theaters={theaters}
        selectedTheaterId={activeTheaterId}
        selectedDate={selectedDate}
        selectedShiftCode={selectedShiftCode}
        searchQuery={searchQuery}
        availableShiftCodes={availableShiftCodes}
        onTheaterChange={handleTheaterChange}
        onDateChange={handleDateChange}
        onShiftCodeChange={handleShiftCodeChange}
        onSearchChange={handleSearchChange}
      />

      {/* Stats Cards */}
      {summary && <AssignmentStats summary={summary} />}

      {/* Shifts List */}
      <ShiftsList
        shifts={filteredShifts}
        isLoading={isLoading}
        onAssignNew={handleAssignNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modals */}
      <AssignStaffModal
        open={isAssignOpen}
        onOpenChange={setAssignOpen}
        selectedSchedule={selectedSchedule}
        selectedTheaterId={activeTheaterId}
      />

      <UpdateAssignmentModal
        open={isUpdateOpen}
        onOpenChange={setUpdateOpen}
        employee={selectedEmployee}
      />

      <ConfirmDeleteAlert
        open={isDeleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmRemove}
        title="Hủy Phân Công?"
        description={`Bạn muốn xóa ${selectedEmployee?.fullName} khỏi ca làm việc này?`}
      />
    </div>
  )
}
