// app/(admin)/shift-manager/components/shift-card.tsx
'use client'

import { useCallback, memo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { UserPlus, MoreVertical, Edit3, UserX, LogOut, X, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ShiftWithEmployees, AssignedEmployee } from '@/types/shift'

interface ShiftCardProps {
  shift: ShiftWithEmployees
  onAssignNew: (shift: ShiftWithEmployees) => void
  onEdit: (employee: AssignedEmployee) => void
  onDelete: (employee: AssignedEmployee) => void
}

function ShiftCard({ shift, onAssignNew, onEdit, onDelete }: ShiftCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<AssignedEmployee | null>(null)
  const [note, setNote] = useState('Đóng ca thủ công do nhân viên quên checkout')
  const [checkOutTime, setCheckOutTime] = useState(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  )
  const getStatusBadge = useCallback((employee: AssignedEmployee) => {
    const hasCheckedIn = !!employee.checkInTime
    const hasCheckedOut = !!employee.checkOutTime

    if (hasCheckedOut) {
      return {
        label: 'Hoàn thành',
        className: 'bg-blue-50 text-blue-700 border-blue-100',
        showPulse: false,
      }
    }
    if (hasCheckedIn) {
      return {
        label: 'Đang làm',
        className: 'bg-green-50 text-green-700 border-green-100',
        showPulse: true,
      }
    }
    return {
      label: 'Chờ làm',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
      showPulse: false,
    }
  }, [])

  return (
    <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderLeft: `4px solid ${shift.shift.color}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: shift.shift.color }}
          >
            {shift.shift.code}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{shift.shift.name}</h3>
            <p className="text-sm text-gray-500">
              {shift.shift.startTime} - {shift.shift.endTime} • {shift.totalEmployees} nhân viên
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onAssignNew(shift)}
          className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white rounded-lg"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Phân công
        </Button>
      </div>

      <CardContent className="p-0">
        {shift.employees.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <UserX className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chưa có nhân viên được phân công</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-medium text-gray-500">Nhân Viên</TableHead>
                <TableHead className="font-medium text-gray-500">Check-in / Out</TableHead>
                <TableHead className="font-medium text-gray-500">Trạng Thái</TableHead>
                <TableHead className="text-right w-[120px]">Hành động</TableHead>
                <TableHead className="text-right w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shift.employees.map(emp => {
                const statusBadge = getStatusBadge(emp)
                return (
                  <TableRow
                    key={emp.assignmentId}
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-gray-200">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback className="bg-indigo-50 text-[#6C63FF]">
                            {emp.fullName ? emp.fullName.charAt(0) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-700">{emp.fullName}</div>
                          <div className="text-xs text-gray-400">{emp.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span
                          className={
                            emp.checkInTime ? 'text-green-600 font-medium' : 'text-gray-400'
                          }
                        >
                          In:{' '}
                          {emp.checkInTime ? format(new Date(emp.checkInTime), 'HH:mm') : '--:--'}
                        </span>
                        <span className={emp.checkOutTime ? 'text-gray-600' : 'text-gray-400'}>
                          Out:{' '}
                          {emp.checkOutTime ? format(new Date(emp.checkOutTime), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-lg px-2.5 py-1 font-medium border shadow-none ${statusBadge.className}`}
                      >
                        {statusBadge.showPulse && (
                          <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {emp.checkInTime && !emp.checkOutTime && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8 px-2"
                          onClick={() => {
                            console.log("🔥 ĐÃ BẤM NÚT ĐÓNG CA CHO:", emp.fullName);
                            setSelectedEmp(emp);
                            setIsModalOpen(true);
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Đóng ca
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// Memoize component để tránh re-render khi props không đổi
export default memo(ShiftCard)
