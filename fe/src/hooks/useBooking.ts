import { useState, useMemo, useEffect, useCallback } from 'react'
import { BookedSeat } from '@/types/booking'
import { Schedule } from '@/types/schedule'
import { CartItem } from '../types'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import { useCreateVNPayUrl, useCreateMoMoUrl } from '@/lib/api/payment'
import { useSchedules } from '@/lib/api/schedules'
import { toast } from 'sonner'
import type { Product } from '@/types/product'
import type { BookingResponseData } from '@/types/booking'
import type { Seat } from '@/types/theater'
import useSocket from '@/hooks/useSocket'
import { useSeatSocket } from '@/app/(client)/movies/[id]/booking-flow/components/useSeatSocket'

export const STEPS = [
  { number: 1, label: 'Chọn suất' },
  { number: 2, label: 'Chọn ghế' },
  { number: 3, label: 'Bắp nước' },
  { number: 4, label: 'Thanh toán' },
  { number: 5, label: 'Xác nhận' },
]

export const MAX_SEATS = 10
export const MAX_PRODUCTS = 20

interface UseBookingProps {
  movieId: string
  preSelectedScheduleId?: string
}

export function useBooking({ movieId, preSelectedScheduleId }: UseBookingProps) {
  // --- WEBSOCKET ---
  const { socket, isConnected } = useSocket()

  // --- DATA ---
  const { data: scheduleData, isLoading: isLoadingSchedules } = useSchedules({ movieId })
  const schedules = scheduleData?.schedules || []

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(preSelectedScheduleId ? 2 : 1)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<BookedSeat[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | null>(null)
  const [createdBookingData, setCreatedBookingData] = useState<BookingResponseData | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string>('')

  // --- AUTO-SELECT SCHEDULE FROM preSelectedScheduleId ---
  useEffect(() => {
    const fetchScheduleDetail = async () => {
      if (!preSelectedScheduleId) return

      try {
        const res = await fetch(
          `http://localhost:5000/api/schedules/${preSelectedScheduleId}`
        )
        const json = await res.json()

        if (json?.data) {
          console.log("DATA SCHEDULE ĐÂY FEN ƠI:", json.data) 
          setSelectedSchedule(json.data)
        }
      } catch (err) {
        console.error("Fetch schedule detail failed:", err)
      }
    }

    fetchScheduleDetail()
  }, [preSelectedScheduleId])

  // --- WEBSOCKET SEAT MANAGEMENT ---
  const { realTimeSeats, viewerCount, isInRoom, holdSeats, releaseSeats } = useSeatSocket({
    socket,
    scheduleId: selectedSchedule?._id || null,
    isConnected,
  })

  // --- API HOOKS ---
  const { mutateAsync: createBookingAsync, isPending: isCreatingBooking } = useCreateBooking()
  const { mutate: createVNPayPayment, isPending: isCreatingVNPay } = useCreateVNPayUrl()
  const { mutate: createMoMoPayment, isPending: isCreatingMoMo } = useCreateMoMoUrl()

  // --- LOGIC TÍNH TOÁN ---
  const totalAmount = useMemo(() => {
    const tickets = selectedSeats.reduce((sum, s) => sum + s.price, 0)
    const products = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
    return tickets + products
  }, [selectedSeats, cartItems])

  // Tính tổng số lượng sản phẩm
  const totalProductQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  // Helper: Tính giá vé dựa trên Schedule đang chọn
  const getSeatPrice = useCallback(
    (seatType: string) => {
      if (!selectedSchedule?.ticketPrices) return 0
      switch (seatType) {
        case 'VIP':
          return selectedSchedule.ticketPrices.vip || selectedSchedule.ticketPrices.standard + 20000
        case 'Ghế đôi':
          return selectedSchedule.ticketPrices.couple || selectedSchedule.ticketPrices.standard * 2
        case 'Thường':
        default:
          return selectedSchedule.ticketPrices.standard
      }
    },
    [selectedSchedule]
  )

  // Helper: Kiểm tra ghế có thể chọn không
  const isSeatAvailable = useCallback(
    (seat: Seat): boolean => {
      const realTimeSeat = realTimeSeats.get(seat.seatNumber)

      if (realTimeSeat) {
        // Ghế đã được bookS
        if (realTimeSeat.isBooked) return false

        // Ghế đang được giữ bởi người khác
        if (realTimeSeat.holdUntil) {
          return false
        }
      }

      return true
    },
    [realTimeSeats]
  )

  // --- HANDLERS ---
  const handleSeatClick = useCallback(
    async (seat: Seat) => {
      if (!selectedSchedule) {
        toast.error('Vui lòng chọn suất chiếu trước')
        return
      }

      // Kiểm tra ghế có available không
      if (!isSeatAvailable(seat)) {
        toast.warning('Ghế này không khả dụng')
        return
      }

      const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber)

      if (isSelected) {
        // Bỏ chọn ghế -> Release qua WebSocket
        const newSelectedSeats = selectedSeats.filter(s => s.seatNumber !== seat.seatNumber)
        setSelectedSeats(newSelectedSeats)

        // Release seat
        releaseSeats([seat.seatNumber])
      } else {
        // Kiểm tra số lượng ghế tối đa
        if (selectedSeats.length >= MAX_SEATS) {
          toast.warning(`Bạn chỉ được chọn tối đa ${MAX_SEATS} ghế`)
          return
        }

        // Chọn ghế mới -> Hold qua WebSocket
        try {
          await holdSeats([seat.seatNumber])

          const price = getSeatPrice(seat.seatType)
          setSelectedSeats(prev => [...prev, { ...seat, price }])
        } catch (error) {
          // Error đã được handle trong useSeatSocket
          console.error('Failed to hold seat:', error)
        }
      }
    },
    [selectedSchedule, selectedSeats, isSeatAvailable, holdSeats, releaseSeats, getSeatPrice]
  )

  const updateCartItem = (product: Product, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.product._id !== product._id))
      return
    }

    // Tính tổng số lượng sản phẩm hiện tại (không bao gồm sản phẩm đang cập nhật)
    const currentTotal = cartItems
      .filter(item => item.product._id !== product._id)
      .reduce((sum, item) => sum + item.quantity, 0)

    // Kiểm tra tổng số lượng có vượt quá giới hạn không
    if (currentTotal + quantity > MAX_PRODUCTS) {
      toast.warning(`Tổng số lượng sản phẩm không được vượt quá ${MAX_PRODUCTS}`)
      return
    }

    setCartItems(prev => {
      const exists = prev.find(item => item.product._id === product._id)
      if (exists)
        return prev.map(item => (item.product._id === product._id ? { ...item, quantity } : item))
      return [...prev, { product, quantity }]
    })
  }

  // --- CORE LOGIC: TẠO ĐƠN (BƯỚC 3 -> 4) ---
  const handleCreateBooking = async () => {
    const scheduleId = preSelectedScheduleId || selectedSchedule?._id

    if (!scheduleId) {
      toast.error('Vui lòng chọn suất chiếu')
      return null
    }
    if (selectedSeats.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ghế')
      return null
    }

    const bookingPayload = {
      scheduleId: scheduleId,
      seats: selectedSeats.map(seat => ({
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        price: seat.price,
      })),
      products: cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        size: item.product.size || 'L',
      })),
      voucherCode: '',
    }

    try {
      const bookingRes = await createBookingAsync(bookingPayload)
      const bookingData = bookingRes.data as BookingResponseData

      setCreatedBookingData(bookingData)
      toast.success('Đã tạo đơn hàng!')

      return bookingData
    } catch (error) {
      console.error(error)
      return null
    }
  }

  // --- CORE LOGIC: TẠO LINK THANH TOÁN (BƯỚC 4 -> 5) ---
  const handleCreatePayment = (bookingId: string) => {
    if (!paymentMethod) return toast.error('Vui lòng chọn phương thức thanh toán')

    const onSuccessHandler = (res: any, method: string) => {
      setPaymentUrl(res.paymentUrl)
      toast.success(`Đã tạo link thanh toán ${method}!`)
      setCurrentStep(5)
    }

    if (paymentMethod === 'vnpay') {
      createVNPayPayment(bookingId, {
        onSuccess: res => onSuccessHandler(res, 'VNPAY'),
      })
    } else if (paymentMethod === 'momo') {
      createMoMoPayment(bookingId, {
        onSuccess: res => onSuccessHandler(res, 'MoMo'),
      })
    }
  }

  // --- NAVIGATION ---
  const nextStep = async () => {
    // Validate step 2 -> 3: Kiểm tra số ghế
    if (currentStep === 2) {
      if (selectedSeats.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 ghế')
        return
      }
      if (selectedSeats.length > MAX_SEATS) {
        toast.error(`Bạn chỉ được chọn tối đa ${MAX_SEATS} ghế`, { position: 'top-right' })
        return
      }
    }

    // Validate step 3 -> 4: Kiểm tra số lượng sản phẩm
    if (currentStep === 3) {
      if (totalProductQuantity > MAX_PRODUCTS) {
        toast.error(`Tổng số lượng sản phẩm không được vượt quá ${MAX_PRODUCTS}`)
        return
      }
    }

    // Bước 4 -> 5: Tạo link thanh toán
    if (currentStep === 4) {
      if (!paymentMethod) {
        toast.error('Vui lòng chọn phương thức thanh toán')
        return
      }

      try {
        const bookingData = await handleCreateBooking()

        if (bookingData) {
          const bookingId = bookingData.bookingId || (bookingData as any)._id
          handleCreatePayment(bookingId)
        }
      } catch (error) {
        console.error('Error creating booking:', error)
      }
      return
    }

    // Các bước khác
    if (currentStep < 5) setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    // Không cho quay lại từ bước 5 (đã thanh toán)
    if (currentStep === 5) return
    // Không cho quay lại step 1 nếu có preSelectedScheduleId
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  // --- CLEANUP: Release seats khi unmount hoặc rời khỏi step 2 ---
  useEffect(() => {
    return () => {
      // Release tất cả ghế đang giữ khi component unmount
      if (selectedSeats.length > 0) {
        const seatNumbers = selectedSeats.map(s => s.seatNumber)
        releaseSeats(seatNumbers)
      }
    }
  }, [])

  // Release seats khi chuyển khỏi step 2 (chọn ghế)
  useEffect(() => {
    if (currentStep !== 2 && selectedSeats.length > 0) {
      // Không release nếu đang ở step 3, 4 (vẫn trong quá trình booking)
      // Chỉ release khi quay lại step 1 hoặc đã hoàn thành
      if (currentStep === 1 || currentStep === 5) {
        const seatNumbers = selectedSeats.map(s => s.seatNumber)
        releaseSeats(seatNumbers)
      }
    }
  }, [currentStep])

  return {
    currentStep,
    selectedSchedule,
    setSelectedSchedule,
    selectedSeats,
    handleSeatClick,
    cartItems,
    updateCartItem,
    paymentMethod,
    setPaymentMethod,
    schedules,
    isLoadingSchedules,
    totalAmount,
    totalProductQuantity,
    paymentUrl,
    createdBookingData,
    isProcessing: isCreatingBooking || isCreatingVNPay || isCreatingMoMo,
    nextStep,
    prevStep,
    // WebSocket data
    realTimeSeats,
    viewerCount,
    isInRoom,
    isConnected,
    isSeatAvailable,
    // Validation limits
    MAX_SEATS,
    MAX_PRODUCTS,
  }
}

// Export type for page component
export type UseBookingReturn = ReturnType<typeof useBooking>
