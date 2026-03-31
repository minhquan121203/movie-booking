'use client'

import { useMemo } from 'react'
import { Calendar, LogIn, LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { AssignedEmployee } from '@/types/shift'

interface ShiftCardProps {
  assignment: AssignedEmployee
  currentLocation: { lat: number; lng: number } | null
  onCheckIn: (assignment: AssignedEmployee) => void
  onCheckOut: (assignment: AssignedEmployee) => void
  skipTimeCheck?: boolean // For testing
}

const formatTime = (timeString: string) => {
  if (timeString.includes('T')) {
    const date = new Date(timeString)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  return timeString
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const canCheckIn = (
  startDateTime: string
): { allowed: boolean; status: 'early' | 'on-time' | 'late' | 'too-late' } => {
  const now = new Date()
  const shiftStart = new Date(startDateTime)
  const diffMinutes = Math.floor((now.getTime() - shiftStart.getTime()) / 60000)

  if (diffMinutes < -10) return { allowed: false, status: 'early' }
  if (diffMinutes <= 5) return { allowed: true, status: 'on-time' }
  if (diffMinutes <= 15) return { allowed: true, status: 'late' }
  return { allowed: false, status: 'too-late' }
}

const calculateWorkDuration = (checkIn: string, checkOut: string): number => {
  const inTime = new Date(checkIn)
  const outTime = new Date(checkOut)
  return Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / 60000))
}

export function ShiftCard({
  assignment,
  currentLocation,
  onCheckIn,
  onCheckOut,
  skipTimeCheck = false,
}: ShiftCardProps) {
  const isCompleted =
    assignment.status === 'completed' || (assignment.checkInTime && assignment.checkOutTime)
  const isOngoing =
    assignment.status === 'checked-in' || (assignment.checkInTime && !assignment.checkOutTime)
  const isPending = assignment.status === 'pending' && !assignment.checkInTime

  // Lấy lý do từ notes (nếu có)
  const managerReason = useMemo(() => {
    if (!assignment.notes) return null
    const match = assignment.notes.match(/Lý do: (.*?)]/)
    return match ? match[1] : null
  }, [assignment.notes])

  const timeCheck = isPending ? canCheckIn(assignment.startDateTime) : null
  const canShowCheckIn = isPending && (skipTimeCheck || timeCheck?.allowed)

  let statusBadge
  if (isCompleted) {
    statusBadge = (
      <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
        managerReason ? 'bg-orange-100 text-orange-600' : 'bg-chart-3/10 text-chart-3'
      }`}>
        {managerReason ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
        {managerReason ? 'Đã đóng (Admin)' : 'Đã hoàn thành'}
      </span>
    )
  } else if (isOngoing) {
    statusBadge = (
      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        Đang diễn ra
      </span>
    )
  } else {
    statusBadge = (
      <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
        Chưa bắt đầu
      </span>
    )
  }

  const workDuration =
    assignment.checkInTime && assignment.checkOutTime
      ? calculateWorkDuration(assignment.checkInTime, assignment.checkOutTime)
      : 0

  return (
    <div
      className={`bg-card rounded-xl border p-6 transition-all h-full flex flex-col justify-between ${
        isOngoing ? 'border-primary shadow-md' : 'border-border'
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 rounded-full shrink-0" style={{ backgroundColor: assignment.color }} />
              <div>
                <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                  {assignment.shiftName} ({assignment.shiftCode})
                </h3>
                <p className="text-sm text-muted-foreground">{assignment.theaterName}</p>
              </div>
            </div>
          </div>
          <div className="shrink-0">{statusBadge}</div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4 p-4 bg-secondary/50 rounded-xl">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ngày làm</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium text-sm">
                {formatDate(assignment.date)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Giờ làm</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium text-sm">
                {assignment.startTime} - {assignment.endTime}
              </span>
            </div>
          </div>

          {assignment.checkInTime && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Check-in</p>
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium text-sm">
                  {formatTime(assignment.checkInTime)}
                </span>
              </div>
            </div>
          )}

          {assignment.checkOutTime && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Check-out</p>
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-destructive" />
                <span className="text-foreground font-medium text-sm">
                  {formatTime(assignment.checkOutTime)}
                </span>
              </div>
            </div>
          )}

          {workDuration > 0 && (
            <div className="col-span-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Thời gian làm thực tế</p>
              <span className="text-lg font-bold text-foreground">
                {Math.floor(workDuration / 60)}h {workDuration % 60}m
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* --- KHUNG HIỂN THỊ GHI CHÚ ÉP ĐÓNG CA --- */}
        {isCompleted && managerReason && (
          <div className="mt-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
            <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Ghi chú từ quản lý</p>
            <p className="text-sm text-orange-800 italic">"{managerReason}"</p>
          </div>
        )}

        {canShowCheckIn && (
          <button
            onClick={() => onCheckIn(assignment)}
            disabled={!currentLocation}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            Check-in ngay
          </button>
        )}

        {isPending && !canShowCheckIn && (
          <div className="p-3 bg-muted/50 rounded-xl text-center border border-dashed border-border">
            <p className="text-xs text-muted-foreground">
              {timeCheck?.status === 'early'
                ? 'Chưa đến giờ check-in (10 phút trước)'
                : 'Không thể check-in (Quá giờ)'}
            </p>
          </div>
        )}

        {isOngoing && (
          <button
            onClick={() => onCheckOut(assignment)}
            className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Check-out
          </button>
        )}
      </div>
    </div>
  )
}