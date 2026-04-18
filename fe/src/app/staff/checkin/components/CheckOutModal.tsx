'use client'

import { useState } from 'react'
import { Clock, LogOut, AlertCircle } from 'lucide-react'
import { AssignedEmployee } from '@/types/shift'

interface CheckOutModalProps {
  assignment: AssignedEmployee
  currentTime: string
  isLoading: boolean
  onConfirm: (breakTime?: number) => void
  onCancel: () => void
}

const calculateWorkDuration = (checkIn: string): number => {
  const inTime = new Date(checkIn)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - inTime.getTime()) / 60000))
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function CheckOutModal({
  assignment,
  currentTime,
  isLoading,
  onConfirm,
  onCancel,
}: CheckOutModalProps) {
  const [breakTime, setBreakTime] = useState<string>('')

  const workDuration = assignment.checkInTime ? calculateWorkDuration(assignment.checkInTime) : 0

  const isEarlyCheckout = () => {
    // Logic kiểm tra checkout sớm dựa vào shift template
    // Tạm thời return false
    return false
  }

  const handleConfirm = () => {
    const breakMinutes = breakTime ? parseFloat(breakTime) : undefined
    onConfirm(breakMinutes)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Xác nhận Check-out</h3>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-secondary/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Thời gian check-out</p>
            <p className="text-foreground text-xl font-semibold">{currentTime}</p>
          </div>

          {assignment.checkInTime && (
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Tổng thời gian làm việc</p>
              <p className="text-foreground text-2xl font-bold">
                {Math.floor(workDuration / 60)}h {workDuration % 60}m
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Check-in: {formatTime(assignment.checkInTime)}
              </p>
            </div>
          )}

          <div className="p-4 bg-secondary/50 rounded-xl">
            <label className="text-sm text-muted-foreground mb-2 block">Thời gian nghỉ (giờ)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="2"
              value={breakTime}
              onChange={e => setBreakTime(e.target.value)}
              placeholder="Ví dụ: 0.5 (30 phút)"
              className="w-full px-3 py-2 bg-input-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nhập thời gian nghỉ giải lao (tùy chọn)
            </p>
          </div>

          {isEarlyCheckout() && (
            <div className="p-4 bg-accent/10 border border-accent rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-accent" />
                <p className="text-accent font-medium">Bạn đang check-out sớm</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Vui lòng liên hệ quản lý nếu cần check-out trước giờ.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                Xác nhận Check-out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
