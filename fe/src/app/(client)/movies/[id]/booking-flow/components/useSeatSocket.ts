import { useEffect, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import type { Seat } from '@/types/theater'

interface SeatStatusUpdate {
  seatAvailability: Array<{
    seatNumber: string
    seatType: string
    isBooked: boolean
    holdUntil?: string
    bookedBy?: string
    action: 'held' | 'released' | 'booked'
  }>
  updatedBy?: string
  viewerCount?: number
}

interface UseSeatSocketProps {
  socket: Socket | null
  scheduleId: string | null
  isConnected: boolean
}

export function useSeatSocket({ socket, scheduleId, isConnected }: UseSeatSocketProps) {
  // Ban đầu cứ để Map rỗng
  const [realTimeSeats, setRealTimeSeats] = useState<Map<string, Seat>>(new Map())
  const [viewerCount, setViewerCount] = useState(0)
  const [isInRoom, setIsInRoom] = useState(false)

  // ==========================================
  // TỰ ĐỘNG FETCH GHẾ (BẢN TỐI GIẢN - ĂN NGAY)
  // ==========================================
  useEffect(() => {
    if (!scheduleId) return;

    const fetchSeats = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/schedules/${scheduleId}`);
        const json = await res.json();

        // 1. Chỉ đích danh cái mảng ghế, không tìm kiếm mù mờ nữa
        const seats = json?.data?.seatAvailability;
        
        console.log("👉 ĐÃ TÓM ĐƯỢC MẢNG GHẾ:", seats);

        // 2. Nếu có ghế thì nạp thẳng vào Map
        if (seats && seats.length > 0) {
          const seatsMap = new Map<string, Seat>();
          seats.forEach((seat: Seat) => {
            if (seat && seat.seatNumber) {
              seatsMap.set(seat.seatNumber, seat);
            }
          });
          
          setRealTimeSeats(seatsMap); 
        } 
        
        // 3. LUÔN LUÔN TẮT LOADING DÙ CÓ GHẾ HAY KHÔNG
        setIsInRoom(true); 

      } catch (err) {
        console.error("❌ Lỗi API:", err);
        setIsInRoom(true); // Lỗi cũng phải tắt loading cho user thấy đường
      }
    };

    fetchSeats();
  }, [scheduleId]);
  // ==========================================

  const joinSchedule = useCallback(() => {
    if (!socket || !scheduleId || !isConnected) return

    console.log('🔵 Joining schedule:', scheduleId)
    socket.emit('join-schedule', { scheduleId })
  }, [socket, scheduleId, isConnected])

  useEffect(() => {
    if (!socket) return
    const handleScheduleJoined = (data: any) => {
      if (data) {
        console.log('✅ Joined schedule successfully', data)

        // Vẫn giữ logic update ghế nếu socket có trả về (dù hiện tại backend ko trả)
        if (data.seatAvailability && Array.isArray(data.seatAvailability)) {
          const seatsMap = new Map<string, Seat>()
          data.seatAvailability.forEach((seat: Seat) => {
            seatsMap.set(seat.seatNumber, seat)
          })
          setRealTimeSeats(seatsMap)
        }
        if (data.viewerCount !== undefined) {
          setViewerCount(data.viewerCount)
        }
      } else {
        console.error('❌ Failed to join schedule:', data?.message)
        toast.error(data?.message || 'Không thể tham gia phòng')
      }
      setIsInRoom(true)
    }

    socket.on('schedule-joined', handleScheduleJoined)
    return () => {
      socket.off('schedule-joined', handleScheduleJoined)
    }
  }, [socket])

  const leaveSchedule = useCallback(() => {
    if (!socket || !scheduleId || !isInRoom) return
    console.log('🔴 Leaving schedule:', scheduleId)
    socket.emit('leave-schedule', { scheduleId })
  }, [socket, scheduleId, isInRoom])

  useEffect(() => {
    if (!socket) return
    const handleLeaveSchedule = (data: any) => {
      console.log('✅ Left schedule successfully')
      setIsInRoom(false)
      setRealTimeSeats(new Map())
      setViewerCount(data.viewerCount)
    }
    socket.on('viewer-left', handleLeaveSchedule)
    return () => {
      socket.off('viewer-left', handleLeaveSchedule)
    }
  }, [socket])

  const holdSeats = useCallback(
    (seatNumbers: string[]) => {
      if (!socket || !scheduleId || !isInRoom) {
        toast.error('Vui lòng đợi kết nối...')
        return Promise.reject('Not connected')
      }
      socket.emit('hold-seats', {
        scheduleId,
        seatNumbers: seatNumbers.map(s => s.toLowerCase()),
      })
    },
    [socket, scheduleId, isInRoom]
  )

  useEffect(() => {
    if (!socket || !scheduleId || !isInRoom) return
    const handleHoldSeats = (data: any) => {
      if (data?.success) {
        console.log('✅ Seats held successfully:', data?.seatNumbers.join(', '))
        toast.success(`Đã giữ ghế: ${data?.seatNumbers.join(', ')}`)
      } else {
        console.error('❌ Failed to hold seats:', data?.message)
        toast.error(data?.message || 'Không thể giữ ghế')
      }
    }
    const handleSeatsStatusChanged = (data: SeatStatusUpdate) => {
      console.log('🔄 Seats status changed:', data)

      setRealTimeSeats(prev => {
        const newMap = new Map(prev)

        data.seatAvailability.forEach(seatUpdate => {
          const existingSeat = newMap.get(seatUpdate.seatNumber)
          if (existingSeat) {
            newMap.set(seatUpdate.seatNumber, {
              ...existingSeat,
              isBooked: seatUpdate.isBooked,
              holdUntil: seatUpdate.holdUntil,
              bookedBy: seatUpdate.bookedBy,
              action: seatUpdate.action,
            })
          }
        })

        return newMap
      })

      if (data.viewerCount !== undefined) {
        setViewerCount(data.viewerCount)
      }
      if (data.seatAvailability.some(s => s.action === 'held')) {
        const seatNumbers = data.seatAvailability.map(s => s.seatNumber).join(', ')
        toast.info(`Ghế ${seatNumbers} đã được giữ bởi người khác`)
      } else if (data.seatAvailability.some(s => s.action === 'booked')) {
        const seatNumbers = data.seatAvailability.map(s => s.seatNumber).join(', ')
        toast.warning(`Ghế ${seatNumbers} đã được đặt`)
      }
    }
    socket.on('seats-held', handleHoldSeats)
    socket.on('seats-status-changed', handleSeatsStatusChanged)

    return () => {
      socket.off('seats-held', handleHoldSeats)
      socket.off('seats-status-changed', handleSeatsStatusChanged)
    }
  }, [socket, scheduleId, isInRoom])

  const releaseSeats = useCallback(
    (seatNumbers: string[]) => {
      if (!socket || !scheduleId || !isInRoom) return

      socket.emit('release-seats', {
        scheduleId,
        seatNumbers,
      })
    },
    [socket, scheduleId, isInRoom]
  )

  useEffect(() => {
    if (!socket || !scheduleId || !isInRoom) return
    const handleSeatsRelease = (data: any) => {
      if (data) {
        console.log('✅ Seats released successfully:', data.seatNumbers.join(','))
      } else {
        return
      }
    }
    socket.on('seats-released', handleSeatsRelease)
    return () => {
      socket.off('seats-released', handleSeatsRelease)
    }
  }, [socket, scheduleId, isInRoom])

  useEffect(() => {
    if (!socket || !isInRoom) return

    const handleError = (error: any) => {
      console.error('🔴 Socket error:', error)
      toast.error(error.message || 'Có lỗi xảy ra')
    }
    socket.on('error', handleError)

    return () => {
      socket.off('error', handleError)
    }
  }, [socket, isInRoom])

  useEffect(() => {
    if (scheduleId && isConnected) {
      joinSchedule()
    }

    return () => {
      if (scheduleId) {
        leaveSchedule()
      }
    }
  }, [scheduleId, isConnected, joinSchedule, leaveSchedule])

  return {
    realTimeSeats,
    viewerCount,
    isInRoom,
    holdSeats,
    releaseSeats,
    joinSchedule,
    leaveSchedule,
  }
}