import { useState, useMemo, useEffect, useCallback } from 'react'
import { BookedSeat } from '@/types/booking'
import { Schedule } from '@/types/schedule'
import { CartItem } from '../types'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import { useCreateVNPayUrl, useCreateMoMoUrl } from '@/lib/api/payment'
import { useSchedules } from '@/lib/api/schedules'
import { previewPointDiscount } from '@/lib/api/loyalty'
import { useUserStore } from '@/store/userStore'
import { toast } from 'sonner'
import type { Product } from '@/types/product'
import type { BookingResponseData } from '@/types/booking'
import type { Seat } from '@/types/theater'
import useSocket from '@/hooks/useSocket'
import { useSeatSocket } from '@/app/(client)/movies/[id]/booking-flow/components/useSeatSocket'

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
  return ''
}

export const STEPS = [
  { number: 1, label: 'Chọn suất' },
  { number: 2, label: 'Chọn ghế' },
  { number: 3, label: 'Bắp nước' },
  { number: 4, label: 'Thanh toán' },
  { number: 5, label: 'Xác nhận' },
]

export const MAX_SEATS = 200
export const MAX_PRODUCTS = 20

interface UseBookingProps {
  movieId: string
  preSelectedScheduleId?: string
}

export function useBooking({ movieId, preSelectedScheduleId }: UseBookingProps) {
  // --- WEBSOCKET ---
  const { socket, isConnected } = useSocket()
  const { fetchUser } = useUserStore()

  // --- DATA ---
  const { data: scheduleData, isLoading: isLoadingSchedules } = useSchedules({ movieId })
  const schedules = scheduleData?.schedules || []

  // --- STATE CƠ BẢN ---
  const [currentStep, setCurrentStep] = useState(preSelectedScheduleId ? 2 : 1)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<BookedSeat[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'bank_transfer' | null>(null)
  const [createdBookingData, setCreatedBookingData] = useState<BookingResponseData | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string>('')

  // --- VOUCHER STATE ---
  const [voucherInput, setVoucherInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string, discountAmount: number } | null>(null)
  const [voucherError, setVoucherError] = useState('')
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false)

  // --- LOYALTY POINTS STATE ---
  const [pointsInput, setPointsInput] = useState<number | ''>('')
  const [appliedPointsDiscount, setAppliedPointsDiscount] = useState<number>(0)
  const [pointsError, setPointsError] = useState('')
  const [isCheckingPoints, setIsCheckingPoints] = useState(false)

  // --- AUTO-SELECT SCHEDULE FROM preSelectedScheduleId ---
  useEffect(() => {
    const fetchScheduleDetail = async () => {
      if (!preSelectedScheduleId) return

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com';

        const fetchUrl = baseUrl.endsWith('/api')
          ? `${baseUrl}/schedules/${preSelectedScheduleId}`
          : `${baseUrl}/api/schedules/${preSelectedScheduleId}`;

        const res = await fetch(fetchUrl)
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

  const activeScheduleId = preSelectedScheduleId || selectedSchedule?._id || null;

  const { realTimeSeats, viewerCount, isInRoom, holdSeats, releaseSeats } = useSeatSocket({
    socket,
    scheduleId: activeScheduleId,
    isConnected,
    onHoldFailed: (failedSeats: string[]) => {
      setSelectedSeats(prev => prev.filter(s => !failedSeats.includes(s.seatNumber)));
    }
  })

  // --- API HOOKS ---
  const { mutateAsync: createBookingAsync, isPending: isCreatingBooking } = useCreateBooking()
  const { mutate: createVNPayPayment, isPending: isCreatingVNPay } = useCreateVNPayUrl()
  const { mutate: createMoMoPayment, isPending: isCreatingMoMo } = useCreateMoMoUrl()

  // --- LOGIC TÍNH TOÁN TIỀN ---
  const subtotalAmount = useMemo(() => {
    const seatsTotal = selectedSeats.reduce((acc, seat) => {
      return acc + seat.price;
    }, 0);

    const combosTotal = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    return seatsTotal + combosTotal;
  }, [selectedSeats, cartItems]);

  const totalAmount = useMemo(() => {
    const voucherDiscount = appliedVoucher?.discountAmount || 0;
    return Math.max(0, subtotalAmount - voucherDiscount - appliedPointsDiscount);
  }, [subtotalAmount, appliedVoucher, appliedPointsDiscount]);

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
      if (!selectedSchedule) return toast.error('Vui lòng chọn suất chiếu trước')
      if (!isSeatAvailable(seat)) return toast.warning('Ghế này không khả dụng')

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
        if (selectedSeats.length >= MAX_SEATS) return toast.warning(`Bạn chỉ được chọn tối đa ${MAX_SEATS} ghế`)

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

    if (currentTotal + quantity > MAX_PRODUCTS) return toast.warning(`Tổng số lượng sản phẩm không được vượt quá ${MAX_PRODUCTS}`)

    setCartItems(prev => {
      const exists = prev.find(item => item.product._id === product._id)
      if (exists)
        return prev.map(item => (item.product._id === product._id ? { ...item, quantity } : item))
      return [...prev, { product, quantity }]
    })
  }

  // --- VOUCHER HANDLERS ---
  const handleApplyVoucher = async () => {
    if (!voucherInput) return
    setIsCheckingVoucher(true)
    setVoucherError('')

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com';
      const fetchUrl = baseUrl.endsWith('/api')
        ? `${baseUrl}/vouchers/verify`
        : `${baseUrl}/api/vouchers/verify`;

      const token = getCookie('authToken');

      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: voucherInput,
          orderValue: subtotalAmount
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Mã giảm giá không hợp lệ')
      }

      setAppliedVoucher({
        code: data.data.code || data.data.voucherCode || voucherInput,
        discountAmount: data.data.discountValue || data.data.discountAmount
      })
      toast.success('Áp dụng mã giảm giá thành công!')
    } catch (error: any) {
      setVoucherError(error.message)
    } finally {
      setIsCheckingVoucher(false)
    }
  }

  const handleClearVoucher = () => {
    setAppliedVoucher(null)
    setVoucherInput('')
    setVoucherError('')
  }

  // LOYALTY POINTS HANDLERS 
  const handleApplyPoints = async () => {
    if (!pointsInput || pointsInput <= 0) return;
    setIsCheckingPoints(true);
    setPointsError('');
    try {
      const res = await previewPointDiscount(pointsInput, subtotalAmount);
      if (res && res.data && res.data.discount !== undefined) {
        setAppliedPointsDiscount(res.data.discount);
        toast.success('Đổi điểm thành công!');
      } else {
        throw new Error('Dữ liệu từ server không hợp lệ');
      }
    } catch (error: any) {
      setPointsError(error?.response?.data?.message || error.message || 'Số điểm không hợp lệ');
      setAppliedPointsDiscount(0);
    } finally {
      setIsCheckingPoints(false);
    }
  };

  const handleClearPoints = () => {
    setPointsInput('');
    setAppliedPointsDiscount(0);
    setPointsError('');
  };

  // --- CORE LOGIC: TẠO ĐƠN ---
  const handleCreateBooking = async () => {
    const scheduleId = preSelectedScheduleId || selectedSchedule?._id
    if (!scheduleId) { toast.error('Vui lòng chọn suất chiếu'); return null; }
    if (selectedSeats.length === 0) { toast.error('Vui lòng chọn ít nhất 1 ghế'); return null; }

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
      voucherCode: appliedVoucher?.code || undefined,
      paymentMethod: paymentMethod,

      // 👇 THÊM DÒNG NÀY ĐỂ GỬI ĐIỂM XUỐNG BACKEND TÍNH TOÁN 👇
      pointsToUse: pointsInput || 0,
    }

    try {
      const bookingRes = await createBookingAsync(bookingPayload)
      const bookingData = bookingRes.data as BookingResponseData
      setCreatedBookingData(bookingData)
      // Refresh user data nếu đã dùng điểm (để cập nhật số dư)
      if (pointsInput && Number(pointsInput) > 0) {
        fetchUser()
      }
      toast.info('Thông tin đặt vé đã được ghi nhận!', { icon: '📝', duration: 2000 })
      return bookingData
    } catch (error) {
      console.error(error)
      toast.error('Không thể tạo đơn hàng, vui lòng kiểm tra lại kết nối!')
      return null
    }
  }

  // --- CORE LOGIC: GỌI API TẠO LINK VÀ BƠM XĂNG ---
  const handleCreatePayment = (bookingId: string, currentMethod: string) => {
    toast.dismiss();

    const onSuccessHandler = (res: any, methodTitle: string) => {
      const link = res.paymentUrl || res.payUrl || res.data?.payUrl || res.checkoutUrl || res.data?.checkoutUrl;
      if (link) {
        setPaymentUrl(link);
        setCurrentStep(5);
      } else {
        toast.error(`Lỗi: Không lấy được link thanh toán ${methodTitle}!`);
      }
    }

    if (currentMethod === 'vnpay') {
      createVNPayPayment(bookingId, { onSuccess: res => onSuccessHandler(res, 'VNPAY') })
    } else if (currentMethod === 'momo') {
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
          const payosUrl = bd.payosCheckoutUrl || bd.data?.payosCheckoutUrl;

          // XỬ LÝ PAYOS 
          if (paymentMethod === 'bank_transfer') {
            if (payosUrl) {
              setPaymentUrl(payosUrl);
              setCurrentStep(5);
            } else {
              toast.error('Thiếu link PayOS từ Server! Cần thêm API PayOS vào booking.controller.js');
              setCurrentStep(5);
            }
            return;
          }

          // VNPay, MoMo flow
          const bookingId = bd._id || bd.bookingId || bd.data?._id;
          handleCreatePayment(bookingId, paymentMethod);

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

    // Xuất các giá trị để UI tính toán Bill
    subtotalAmount,
    totalAmount,
    totalProductQuantity,

    // Xuất các state và hàm xử lý Voucher ra ngoài UI
    voucherInput,
    setVoucherInput,
    appliedVoucher,
    voucherError,
    isCheckingVoucher,
    handleApplyVoucher,
    handleClearVoucher,

    pointsInput,
    setPointsInput,
    appliedPointsDiscount,
    pointsError,
    isCheckingPoints,
    handleApplyPoints,
    handleClearPoints,

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