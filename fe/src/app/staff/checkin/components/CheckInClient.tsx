'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { useUserAssignments, useAssignmentMutations } from '@/lib/api/shift-assignments'
import { CheckInModal } from './CheckInModal'
import { CheckOutModal } from './CheckOutModal'
import { ActiveShiftCard } from './ActiveShiftCard'
import { ShiftCard } from './ShiftCard'
import { useUserStore } from '@/store/userStore'
import { AssignedEmployee } from '@/types/shift'
const TEST_MODE = true
const SKIP_LOCATION_CHECK = true
const SKIP_TIME_CHECK = true

const theaterLocation = { lat: 10.7769, lng: 106.7009 }
const maxDistanceMeters = 100

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

const getCurrentTime = (): string => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function CheckInClient() {
  const { user } = useUserStore()

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(getCurrentTime())
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<AssignedEmployee | null>(null)

  // Fetch user assignments for the current week
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: assignmentsData, isLoading } = useUserAssignments(user?._id || '', {
    from: today,
    to: nextWeek,
  })

  const assignments: AssignedEmployee[] = useMemo(() => {
    return assignmentsData?.assignments || []
  }, [assignmentsData])
  const { checkIn, checkOut } = useAssignmentMutations()

  // Categorize assignments
  const categorizedAssignments = useMemo(() => {
    const now = new Date()

    return {
      // Active shift (checked in but not checked out)
      active: assignments.find(a => a.status === 'checked-in' && !a.checkOutTime),

      // Upcoming shifts
      upcoming: SKIP_TIME_CHECK
        ? assignments.filter(a => a.status === 'pending') // TEST MODE: All pending shifts
        : assignments.filter(a => {
            if (a.status !== 'pending') return false

            const startTime = new Date(a.startDateTime)
            const diffMinutes = Math.floor((startTime.getTime() - now.getTime()) / 60000)

            // Can check in 10 minutes before start time
            return diffMinutes >= -10 && diffMinutes <= 30
          }),

      // All shifts in the week
      allShifts: assignments.sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      ),
    }
  }, [assignments])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Get user location
  useEffect(() => {
    if (SKIP_LOCATION_CHECK) {
      // TEST MODE: Use mock location
      setCurrentLocation({ lat: 10.7769, lng: 106.7009 })
      setLocationError(null)
      return
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationError(null)
        },
        () => {
          setLocationError('Không thể lấy vị trí. Vui lòng bật GPS.')
          setCurrentLocation({ lat: 10.7769, lng: 106.7009 })
        }
      )
    } else {
      setLocationError('Trình duyệt không hỗ trợ GPS.')
      setCurrentLocation({ lat: 10.7769, lng: 106.7009 })
    }
  }, [])

  const handleCheckInClick = (assignment: AssignedEmployee) => {
    setSelectedAssignment(assignment)
    setShowCheckInModal(true)
  }

  const handleCheckIn = async () => {
    if (!selectedAssignment || !currentLocation) return

    // Validate location (SKIP IN TEST MODE)
    if (!SKIP_LOCATION_CHECK) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        theaterLocation.lat,
        theaterLocation.lng
      )

      if (distance > maxDistanceMeters) {
        alert(`Bạn đang ở quá xa rạp (${Math.round(distance)}m). Vui lòng đến rạp để check-in.`)
        return
      }
    }

    // TEST MODE: Always allow check-in
    if (TEST_MODE) {
      console.log('🧪 TEST MODE: Skipping all validations')
    }

    await checkIn.mutateAsync(selectedAssignment.workScheduleId)
    setShowCheckInModal(false)
    setSelectedAssignment(null)
  }

  const handleCheckOutClick = (assignment: AssignedEmployee) => {
    setSelectedAssignment(assignment)
    setShowCheckOutModal(true)
  }

  const handleCheckOut = async (breakTime?: number) => {
    if (!selectedAssignment) return

    // TEST MODE: Always allow check-out
    if (TEST_MODE) {
      console.log('🧪 TEST MODE: Skipping all validations')
    }

    await checkOut.mutateAsync(selectedAssignment.workScheduleId)
    setShowCheckOutModal(false)
    setSelectedAssignment(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Test Mode Banner */}
      {/* {TEST_MODE && (
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4">
          <p className="text-yellow-900 dark:text-yellow-100 font-semibold">🧪 TEST MODE ACTIVE</p>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
            <li>• Location check: {SKIP_LOCATION_CHECK ? '❌ Disabled' : '✅ Enabled'}</li>
            <li>• Time window check: {SKIP_TIME_CHECK ? '❌ Disabled' : '✅ Enabled'}</li>
            <li>• All pending shifts available for check-in</li>
          </ul>
        </div>
      )} */}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Check-in Ca Làm Việc</h1>
        <p className="text-muted-foreground">Điểm danh và quản lý thời gian làm việc của bạn</p>
      </div>

      {/* Current Time & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-hover p-6 rounded-xl text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6" />
            <h3 className="font-semibold">Thời gian hiện tại</h3>
          </div>
          <p className="text-3xl font-bold">{currentTime}</p>
          <p className="text-sm opacity-80 mt-1">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })}
          </p>
        </div>

        <div
          className={`p-6 rounded-xl ${currentLocation ? 'bg-gradient-to-br from-chart-3 to-chart-3/80' : 'bg-gradient-to-br from-muted to-muted/80'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <MapPin
              className={`w-6 h-6 ${currentLocation ? 'text-white' : 'text-muted-foreground'}`}
            />
            <h3
              className={`font-semibold ${currentLocation ? 'text-white' : 'text-muted-foreground'}`}
            >
              Vị trí GPS {SKIP_LOCATION_CHECK && '(Mock)'}
            </h3>
          </div>
          {currentLocation ? (
            <>
              <p className="text-3xl font-bold text-white">Đã bật</p>
              <p className="text-sm opacity-80 mt-1 text-white">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl text-muted-foreground">Không khả dụng</p>
              <p className="text-sm opacity-80 mt-1 text-muted-foreground">{locationError}</p>
            </>
          )}
        </div>
      </div>

      {/* Active Shift */}
      {categorizedAssignments.active && (
        <ActiveShiftCard
          assignment={categorizedAssignments.active}
          currentTime={currentTime}
          onCheckOut={handleCheckOutClick}
        />
      )}

      {/* Upcoming Shifts - Quick Check-in */}
      {categorizedAssignments.upcoming.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Ca Làm Việc {TEST_MODE ? '(Tất cả - Test Mode)' : 'Sắp Tới'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {categorizedAssignments.upcoming.map(assignment => (
              <div
                key={assignment._id}
                className="bg-card rounded-xl border-2 border-primary/50 p-6 hover:border-primary transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {assignment.shiftName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{assignment.theaterName}</p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: assignment.color }}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ngày:</span>
                    <span className="text-foreground font-medium">
                      {new Date(assignment.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giờ làm:</span>
                    <span className="text-foreground font-medium">
                      {assignment.startTime} - {assignment.endTime}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckInClick(assignment)}
                  disabled={!currentLocation}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="w-5 h-5" />
                  Check-in ngay
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Shifts in Week */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Lịch Làm Việc Tuần Này</h2>
        {categorizedAssignments.allShifts.length > 0 ? (
          <div className="space-y-4 grid grid-cols-2 gap-4">
            {categorizedAssignments.allShifts.map(assignment => (
              <ShiftCard
                key={assignment._id}
                assignment={assignment}
                currentLocation={currentLocation}
                onCheckIn={handleCheckInClick}
                onCheckOut={handleCheckOutClick}
                skipTimeCheck={SKIP_TIME_CHECK}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">Không có ca làm việc nào trong tuần này</p>
          </div>
        )}
      </section>

      {/* Modals */}
      {showCheckInModal && selectedAssignment && (
        <CheckInModal
          assignment={selectedAssignment}
          currentLocation={currentLocation}
          currentTime={currentTime}
          isLoading={checkIn.isPending}
          onConfirm={handleCheckIn}
          onCancel={() => {
            setShowCheckInModal(false)
            setSelectedAssignment(null)
          }}
        />
      )}

      {showCheckOutModal && selectedAssignment && (
        <CheckOutModal
          assignment={selectedAssignment}
          currentTime={currentTime}
          isLoading={checkOut.isPending}
          onConfirm={handleCheckOut}
          onCancel={() => {
            setShowCheckOutModal(false)
            setSelectedAssignment(null)
          }}
        />
      )}
    </div>
  )
}
