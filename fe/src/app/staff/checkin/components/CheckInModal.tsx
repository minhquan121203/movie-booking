'use client'

import { Clock, Navigation, Smartphone, CheckCircle2 } from 'lucide-react'
import { AssignedEmployee } from '@/types/shift'

interface CheckInModalProps {
  assignment: AssignedEmployee
  currentLocation: { lat: number; lng: number } | null
  currentTime: string
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

const theaterLocation = { lat: 10.7769, lng: 106.7009 }

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  const dateStr = date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${dateStr} • ${timeStr}`
}

export function CheckInModal({
  assignment,
  currentLocation,
  currentTime,
  isLoading,
  onConfirm,
  onCancel,
}: CheckInModalProps) {
  const distance = currentLocation
    ? calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        theaterLocation.lat,
        theaterLocation.lng
      )
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Xác nhận Check-in</h3>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-secondary/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Ca làm việc</p>
            <p className="text-foreground font-medium">{formatDateTime(assignment.assignedAt)}</p>
            <p className="text-sm text-muted-foreground mt-1">{assignment.role}</p>
          </div>

          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Thời gian check-in</p>
            </div>
            <p className="text-foreground text-xl font-semibold">{currentTime}</p>
          </div>

          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Vị trí</p>
            </div>
            {currentLocation ? (
              <div>
                <p className="text-foreground text-sm">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                {distance !== null && (
                  <p
                    className={`text-sm mt-1 ${distance <= 100 ? 'text-chart-3' : 'text-destructive'}`}
                  >
                    {distance <= 100 ? '✓' : '✗'}{' '}
                    {distance <= 100 ? 'Trong phạm vi rạp' : 'Ngoài phạm vi rạp'} (
                    {Math.round(distance)}m)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-destructive text-sm">Không thể xác định vị trí</p>
            )}
          </div>

          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Thiết bị</p>
            </div>
            <p className="text-foreground text-xs break-all">
              {navigator.userAgent.slice(0, 80)}...
            </p>
          </div>
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
            onClick={onConfirm}
            disabled={isLoading || !currentLocation}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Xác nhận Check-in
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
