// app/(admin)/shift-manager/components/shifts-list.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Loader2, Filter } from 'lucide-react'
import ShiftCard from './shift-card'
import { ShiftWithEmployees, AssignedEmployee } from '@/types/shift'

interface ShiftsListProps {
  shifts: ShiftWithEmployees[]
  isLoading: boolean
  onAssignNew: (shift: ShiftWithEmployees) => void
  onEdit: (employee: AssignedEmployee) => void
  onDelete: (employee: AssignedEmployee) => void
}

export default function ShiftsList({
  shifts,
  isLoading,
  onAssignNew,
  onEdit,
  onDelete,
}: ShiftsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (shifts.length === 0) {
    return (
      <Card className="py-12 text-center text-gray-400">
        <Filter className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Không có ca làm việc nào trong ngày này</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {shifts.map(shift => (
        <ShiftCard
          key={shift.scheduleId}
          shift={shift}
          onAssignNew={onAssignNew}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
