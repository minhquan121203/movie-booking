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
      const [startHour] = shift.shift.startTime.split(':').map(Number)
      const [endHour, endMinute] = shift.shift.endTime.split(':').map(Number)

      const now = new Date()
      const endDate = new Date()
      endDate.setHours(endHour, endMinute, 0, 0)

      // Xử lý ca làm qua đêm (Ví dụ: 22:00 -> 02:00 sáng)
      if (endHour < startHour) {
        endDate.setDate(endDate.getDate() + 1)
      }

      // 1. Kiểm tra xem quá giờ chưa (Nếu quá => BÁO ĐỎ)
      if (now > endDate) {
        return {
          label: 'Quên Check-out',
          className: 'bg-red-100 text-red-700 border-red-200',
          showPulse: true,
          pulseColor: 'bg-red-600',    
          pulsePing: 'bg-red-400'      
        }
      }

      // 2. Nếu chưa quá giờ => VẪN ĐANG LÀM BÌNH THƯỜNG (XANH)
      return {
        label: 'Đang làm',
        className: 'bg-green-50 text-green-700 border-green-100',
        showPulse: true,
        pulseColor: 'bg-green-500',   
        pulsePing: 'bg-green-400'
      }
    }
    
    return {
      label: 'Chờ làm',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
      showPulse: false,
    }
  }, [shift.shift.startTime, shift.shift.endTime]) 

  return (
    <> 
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
                      <TableCell className="text-right">=
                        {emp.checkInTime && !emp.checkOutTime && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8 px-2"
                            onClick={() => {
                              setSelectedEmp(emp);
                              setIsModalOpen(true);
                            }}
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            Đóng ca
                          </Button>
                        )}

                        {!emp.checkInTime && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 px-2"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn hủy phân công của nhân viên ${emp.fullName} khỏi ca này không?`)) {
                                onDelete(emp); 
                              }
                            }}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Hủy ca
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

      {isModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            
            <div className="p-4 border-b flex justify-between items-center bg-orange-50">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Ép đóng ca làm việc</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Bạn đang đóng ca thủ công cho: <span className="font-bold text-gray-900">{selectedEmp.fullName}</span>
              </p>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Giờ ra thực tế</label>
                <input
                  type="datetime-local"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Lý do đóng ca</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    const getCookie = (name: string) => {
                      const value = `; ${document.cookie}`;
                      const parts = value.split(`; ${name}=`);
                      if (parts.length === 2) return parts.pop()?.split(';').shift();
                      return '';
                    };

                    const token = getCookie('authToken');

                    const response = await fetch('https://movie-booking-api-bcfe.onrender.com/api/assignments/force-checkout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                      },
                      body: JSON.stringify({
                        assignmentId: selectedEmp.assignmentId,
                        manualCheckOutTime: new Date(checkOutTime).toISOString(),
                        managerNote: note
                      })
                    });

                    const result = await response.json();

                    if (response.ok) {
                      alert("Đã ép đóng ca thành công!");
                      setIsModalOpen(false);
                      window.location.reload(); 
                    } else {
                      alert("Lỗi: " + (result.message || "Không thể đóng ca"));
                    }
                  } catch (error) {
                    console.error("Lỗi khi gọi API:", error);
                    alert("Đã xảy ra lỗi hệ thống!");
                  }
                }}
                className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(ShiftCard)