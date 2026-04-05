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
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'bank_transfer' | null>(null)
  const [createdBookingData, setCreatedBookingData] = useState<BookingResponseData | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string>('')

  // --- AUTO-SELECT SCHEDULE FROM preSelectedScheduleId ---
  useEffect(() => {
    const fetchScheduleDetail = async () => {
      if (!preSelectedScheduleId) return

      try {
        const res = await fetch(
          `https://movie-booking-api-bcfe.onrender.com/api/schedules/${preSelectedScheduleId}` 
        )
        const json = await res.json()

        if (json?.data) {
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
    const seatsTotal = selectedSeats.reduce((acc, seat) => {
      const isCouple = seat.seatType?.toLowerCase().includes('đôi') || seat.seatType?.toLowerCase().includes('couple');
      return acc + (isCouple ? seat.price / 2 : seat.price);
    }, 0);

    const combosTotal = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    
    return seatsTotal + combosTotal;
  }, [selectedSeats, cartItems]);

  const totalProductQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

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

  const isSeatAvailable = useCallback(
    (seat: Seat): boolean => {
      const realTimeSeat = realTimeSeats.get(seat.seatNumber)
      if (realTimeSeat) {
        if (realTimeSeat.isBooked) return false
        if (realTimeSeat.holdUntil) return false
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

      if (!isSeatAvailable(seat)) {
        toast.warning('Ghế này không khả dụng')
        return
      }

      const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber)

      if (isSelected) {
        try {
          await releaseSeats([seat.seatNumber])
        } catch (error) {
          console.error('Release error:', error)
        } finally {
          setSelectedSeats(prev => prev.filter(s => s.seatNumber !== seat.seatNumber))
        }
      } else {
        if (selectedSeats.length >= MAX_SEATS) {
          toast.warning(`Bạn chỉ được chọn tối đa ${MAX_SEATS} ghế`)
          return
        }

        try {
          await holdSeats([seat.seatNumber])
          const price = getSeatPrice(seat.seatType)

          setSelectedSeats(prev => {
            if (prev.some(s => s.seatNumber === seat.seatNumber)) return prev;
            return [...prev, { ...seat, price }];
          })
        } catch (error) {
          console.error('Failed to hold seat:', error)
          toast.error('Ghế này vừa có người chọn mất rồi!')
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

    const currentTotal = cartItems
      .filter(item => item.product._id !== product._id)
      .reduce((sum, item) => sum + item.quantity, 0)

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

  // --- CORE LOGIC: TẠO ĐƠN ---
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
      paymentMethod: paymentMethod
    }

    try {
      const bookingRes = await createBookingAsync(bookingPayload)
      const bookingData = bookingRes.data as BookingResponseData

      setCreatedBookingData(bookingData)
      toast.info('Thông tin đặt vé đã được ghi nhận!', { icon: '📝', duration: 2000 })

      return bookingData
    } catch (error) {
      console.error(error)
      toast.error('Không thể tạo đơn hàng, vui lòng kiểm tra lại kết nối!')
      return null
    }
  }

  // --- CORE LOGIC: GỌI API PHỤ TẠO LINK (NẾU CẦN) ---
  const handleCreatePayment = (bookingId: string) => {
    toast.dismiss();
    if (!paymentMethod) return toast.error('Vui lòng chọn phương thức thanh toán')

    const onSuccessHandler = (res: any, method: string) => {
      const link = res.paymentUrl || res.payUrl || res.data?.payUrl || res.checkoutUrl;
      if (link) {
        toast.loading(`Đang chuyển hướng sang ${method}...`);
        // 🚀 ĐÁ BAY SANG APP MOMO/VNPAY LUÔN
        window.location.href = link; 
      } else {
        toast.error('Lỗi: Không lấy được link thanh toán!');
      }
    }

    if (paymentMethod === 'vnpay') {
      createVNPayPayment(bookingId, { onSuccess: res => onSuccessHandler(res, 'VNPAY') })
    } else if (paymentMethod === 'momo') {
      createMoMoPayment(bookingId, { onSuccess: res => onSuccessHandler(res, 'MoMo') })
    }
  }

  // --- NAVIGATION (LUỒNG NEXT STEP) ---
  const nextStep = async () => {
    if (currentStep === 2) {
      if (selectedSeats.length === 0) return toast.error('Vui lòng chọn ít nhất 1 ghế')
      if (selectedSeats.length > MAX_SEATS) return toast.error(`Bạn chỉ được chọn tối đa ${MAX_SEATS} ghế`)
    }

    if (currentStep === 3) {
      if (totalProductQuantity > MAX_PRODUCTS) return toast.error(`Tổng số lượng sản phẩm không vượt quá ${MAX_PRODUCTS}`)
    }

    // Bước 4 -> 5: Chốt đơn và thanh toán
    if (currentStep === 4) {
      if (!paymentMethod) return toast.error('Vui lòng chọn phương thức thanh toán')

      try {
        const bookingData = await handleCreateBooking()

        if (bookingData) {
          const bd = bookingData as any;

          if ((paymentMethod === 'bank_transfer' || paymentMethod === 'momo') && bd.payosCheckoutUrl) {
            toast.loading(`Đang chuyển hướng sang trang thanh toán...`);
            window.location.href = bd.payosCheckoutUrl;
            return; 
          }

          const bookingId = bd._id || bd.bookingId
          handleCreatePayment(bookingId) 
          
          return; 
        }
      } catch (error) {
        console.error('Error creating booking:', error)
      }
      return
    }

    if (currentStep < 5) setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    if (currentStep === 5) return
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  // --- CLEANUP ---
  useEffect(() => {
    return () => {
      if (selectedSeats.length > 0) {
        releaseSeats(selectedSeats.map(s => s.seatNumber))
      }
    }
  }, [])

  useEffect(() => {
    if (currentStep !== 2 && selectedSeats.length > 0) {
      if (currentStep === 1 || currentStep === 5) {
        releaseSeats(selectedSeats.map(s => s.seatNumber))
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
    realTimeSeats,
    viewerCount,
    isInRoom,
    isConnected,
    isSeatAvailable,
    MAX_SEATS,
    MAX_PRODUCTS,
  }
}

export type UseBookingReturn = ReturnType<typeof useBooking>