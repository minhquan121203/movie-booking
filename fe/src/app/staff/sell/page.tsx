'use client'

import { useState, useEffect } from 'react'
import { useMovies } from '@/lib/api/movies'
import { useSchedules } from '@/lib/api/schedules'
import { useProducts } from '@/lib/api/products'
import { useBooking } from '@/hooks/useBooking'
import { useStaffCreateBooking } from '@/hooks/useCreateBooking'
import { toast } from 'sonner'
import { MovieSelector } from './components/MovieSelector'
import { SeatSelector } from './components/SeatSelector'
import { BookingSummary } from './components/BookingSummary'
import { ProductSelector, type CartProduct } from './components/ProductSelector'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { User, Mail, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { useNotification } from '@/providers/NotificationProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/store/userStore'
import type { Product } from '@/types/product'

const customerSchema = z.object({
  fullName: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')),
})

type CustomerFormData = z.infer<typeof customerSchema>

export default function TicketSales() {
  // Lấy theaterId từ store
  const staffTheaterId = useUserStore(state => state.staffTheaterId)
  const _hasHydrated = useUserStore(state => state._hasHydrated)

  // State UI
  const [selectedMovieId, setSelectedMovieId] = useState<string>('ALL') // 'ALL' = tất cả phim
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'))
  const [showAllDates, setShowAllDates] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const { showSuccess, showError } = useNotification()
  const queryClient = useQueryClient()
  const [customerInfo, setCustomerInfo] = useState<CustomerFormData | null>(null)
  const [lastBooking, setLastBooking] = useState<any>(null)
  // Giỏ bắp nước
  const [productCart, setProductCart] = useState<CartProduct[]>([])

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  })

  // Fetch Movies (tất cả phim đang chiếu)
  const { data: movieData } = useMovies({ status: 'Đang chiếu', limit: 100 })
  const movies = movieData?.movies || []

  // Fetch sản phẩm bắp nước
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ isActive: true, inStock: true })
  const products = (productsData as any) || []

  // Fetch Schedules
  const { data: schedulesData, isLoading: isLoadingSchedules } = useSchedules({
    theaterId: staffTheaterId || undefined,
    movieId: selectedMovieId !== 'ALL' ? selectedMovieId : undefined,
    showDate: !showAllDates ? selectedDate : undefined,
    limit: 100,
  })

  const schedules = schedulesData?.schedules || []

  const { selectedSchedule, setSelectedSchedule, selectedSeats, handleSeatClick, totalAmount } =
    useBooking({ movieId: selectedMovieId === 'ALL' ? '' : selectedMovieId })

  const { mutate: staffCreateBooking, isPending } = useStaffCreateBooking()

  useEffect(() => {
    setSelectedSchedule(null)
  }, [selectedMovieId, selectedDate, showAllDates, setSelectedSchedule])

  const onCustomerSubmit = (data: CustomerFormData) => {
    setCustomerInfo(data)
    toast.success(`Đã nhận khách: ${data.fullName}`)
  }

  const handleBackToCustomer = () => {
    if (confirm('Quay lại sẽ xóa các ghế đang chọn. Bạn chắc chắn chứ?')) {
      setCustomerInfo(null)
      setSelectedSchedule(null)
      setLastBooking(null)
      setProductCart([])
    }
  }

  // Hàm quản lý giỏ bắp nước
  const handleAddProduct = (product: Product) => {
    setProductCart(prev => {
      const existing = prev.find(i => i.productId === product._id)
      if (existing) return prev.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product._id, name: product.name, price: product.price, quantity: 1, size: product.size }]
    })
  }

  const handleRemoveProduct = (productId: string) => {
    setProductCart(prev => {
      const existing = prev.find(i => i.productId === productId)
      if (existing && existing.quantity > 1) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter(i => i.productId !== productId)
    })
  }

  const handlePayment = () => {
    if (!selectedSchedule) return toast.error('Chưa chọn suất chiếu')
    if (selectedSeats.length === 0) return toast.error('Chưa chọn ghế')
    if (!customerInfo) return toast.error('Thiếu thông tin khách hàng')

    const payload: any = {
      scheduleId: selectedSchedule._id,
      seats: selectedSeats.map(s => ({
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        price: s.price,
      })),
      // Thêm sản phẩm bắp nước nếu có
      products: productCart.length > 0 ? productCart.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        size: p.size !== 'N/A' ? p.size : undefined,
      })) : undefined,
      customerInfo: {
        fullName: customerInfo.fullName,
        email: customerInfo.email || 'no-email@example.com',
      },
      paymentMethod,
      cashReceived: 0,
    }

    staffCreateBooking(payload, {
      onSuccess: (result: any) => {
        const responseData = result.data || result
        const qrUrl = responseData?.payosCheckoutUrl || responseData?.data?.payosCheckoutUrl

        if (paymentMethod === 'bank_transfer') {
          if (qrUrl) {
            showSuccess('Đang chuyển đến trang thanh toán...')
            window.location.href = qrUrl
          } else {
            showError('Lỗi hệ thống', 'Không thể kết nối PayOS để tạo mã QR. Vui lòng thử lại!')
          }
        } else {
          const bookingResult = responseData?.booking || responseData
          setLastBooking(bookingResult)
          // Không reset productCart ở đây để in vé có dữ liệu bắp nước, sẽ reset ở onPrintDone
          showSuccess('Tạo đơn thành công! Nhấn "In Vé" để in.')
          queryClient.invalidateQueries({ queryKey: ['schedules'] })
          setSelectedSchedule(null)
        }
      },
    })
  }

  // Loading state khi chưa hydrate
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Kiểm tra staff có theaterId không
  if (!staffTheaterId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Không có quyền truy cập</CardTitle>
            <CardDescription>
              Bạn chưa được gán rạp chiếu. Vui lòng liên hệ quản trị viên.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // VIEW 1: FORM NHẬP THÔNG TIN KHÁCH HÀNG
  if (!customerInfo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-gray-50/50 p-4">
        <Card className="w-full max-w-md shadow-lg border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-primary">
              Thông Tin Khách Hàng
            </CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin để bắt đầu quy trình bán vé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCustomerSubmit)} className="space-y-4">
              {/* Tên Khách Hàng */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" /> Họ và tên
                </Label>
                <Input
                  id="fullName"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  {...register('fullName')}
                  className={errors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" /> Email (Tùy chọn)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="khachhang@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-4 font-semibold">
                Tiếp Tục Chọn Phim <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // VIEW 2: GIAO DIỆN BÁN VÉ CHÍNH
  return (
    <div className="h-full pb-4 flex flex-col gap-4">
      {/* Header Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Khách hàng</p>
            <h2 className="text-sm font-bold text-gray-900">{customerInfo.fullName}</h2>
          </div>
          {customerInfo.email && (
            <div className="hidden md:block pl-4 border-l border-gray-200 ml-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Email</p>
              <p className="text-sm text-gray-700">{customerInfo.email}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToCustomer}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Đổi khách
        </Button>
      </div>

      {/* Grid Layout Chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Cột Trái & Giữa */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <MovieSelector
            movies={movies}
            selectedMovieId={selectedMovieId}
            onSelectMovie={setSelectedMovieId}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            showAllDates={showAllDates}
            onToggleAllDates={setShowAllDates}
          />

          <SeatSelector
            schedules={schedules}
            isLoadingSchedules={isLoadingSchedules}
            selectedSchedule={selectedSchedule}
            onSelectSchedule={setSelectedSchedule}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
          />

          {/* Chọn bắp nước kèm vé */}
          {!isLoadingProducts && products.length > 0 && (
            <ProductSelector
              products={products}
              cart={productCart}
              onAdd={handleAddProduct}
              onRemove={handleRemoveProduct}
              onClear={() => setProductCart([])}
            />
          )}
        </div>

        {/* Cột Phải */}
        <div className="lg:col-span-1 min-h-0">
          <BookingSummary
            selectedSchedule={selectedSchedule}
            selectedSeats={selectedSeats}
            totalAmount={totalAmount + productCart.reduce((s, p) => s + p.price * p.quantity, 0)}
            productCart={productCart}
            paymentMethod={paymentMethod as any}
            setPaymentMethod={setPaymentMethod as any}
            onPayment={handlePayment}
            isProcessing={isPending}
            lastBooking={lastBooking}
            onPrintDone={() => {
              // Reset sau khi in → phục vụ khách mới
              setCustomerInfo(null)
              setLastBooking(null)
              setProductCart([])
              reset()
            }}
          />
        </div>
      </div>
    </div>
  )
}
