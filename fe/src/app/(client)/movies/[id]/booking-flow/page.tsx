'use client'

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/hooks/useBooking'
import { BookingHeader } from './components/BookingHeader'
import { BookingProgress } from './components/BookingProgress'
import { BookingSummary } from './components/BookingSummary'
import { StepShowtime } from './components/steps/StepShowtime'
import { StepSeatSelection } from './components/steps/StepSeatSelection'
import { StepCombo } from './components/steps/StepCombo'
import { StepPaymentMethod } from './components/steps/StepPaymentMethod'
import { StepPayment } from './components/steps/StepPayment'
import { WebSocketDebug } from './WebSocketDebug'
import { useParams, useSearchParams } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'

export default function BookingPage() {
  const params = useParams()
  const movieId = params.id as string

  const searchParams = useSearchParams()
  const preSelectedScheduleId = searchParams.get('scheduleId') || undefined

  const movieTitle = 'Đặt vé xem phim'

  const { user, fetchUser } = useUserStore()

  // Lấy điểm mới nhất từ server khi vào trang booking
  useEffect(() => {
    if (typeof fetchUser === 'function') {
      fetchUser()
    }
  }, [fetchUser])

  const {
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
    voucherInput,
    setVoucherInput,
    appliedVoucher,
    voucherError,
    isCheckingVoucher,
    handleApplyVoucher,
    handleClearVoucher,
    subtotalAmount,
    totalAmount,
    nextStep,
    prevStep,
    isProcessing,
    createdBookingData,
    paymentUrl,
    // WebSocket data
    realTimeSeats,
    viewerCount,
    isInRoom,
    isConnected,
    isSeatAvailable,

    pointsInput,
    setPointsInput,
    appliedPointsDiscount,
    pointsError,
    isCheckingPoints,
    handleApplyPoints,
    handleClearPoints,
  } = useBooking({ movieId, preSelectedScheduleId })

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepShowtime
            movieTitle={movieTitle}
            schedules={schedules}
            isLoading={isLoadingSchedules}
            selectedSchedule={selectedSchedule}
            onSelect={setSelectedSchedule}
          />
        )
      case 2:
        if (preSelectedScheduleId && !selectedSchedule) {
          return (
            <div className="flex flex-col items-center justify-center py-32 text-violet-600">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-bold text-lg animate-pulse">Đang chuẩn bị phòng chiếu...</p>
            </div>
          )
        }

        return (
          <StepSeatSelection
            selectedSeats={selectedSeats}
            schedule={selectedSchedule}
            onSeatClick={handleSeatClick}
            realTimeSeats={realTimeSeats}
            viewerCount={viewerCount}
            isConnected={isConnected}
            isInRoom={isInRoom}
            isSeatAvailable={isSeatAvailable}
          />
        )
      case 3:
        return <StepCombo cartItems={cartItems} updateCartItem={updateCartItem} />
      case 4:
        return <StepPaymentMethod selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
      case 5:
        return (
          <StepPayment
            paymentUrl={paymentUrl}
            bookingCode={createdBookingData?.bookingCode}
            totalAmount={totalAmount}
            paymentMethod={paymentMethod}
          />
        )
      default:
        return null
    }
  }

  // Điều kiện disable nút tiếp tục
  const isNextDisabled = () => {
    if (isProcessing) return true

    switch (currentStep) {
      case 1:
        return !selectedSchedule
      case 2:
        return selectedSeats.length === 0 || !isInRoom
      case 3:
        return false
      case 4:
        return !paymentMethod
      case 5:
        return true
      default:
        return false
    }
  }

  // Chỉ hiện voucher/điểm thưởng ở step >= 4 (Thanh toán)
  const showDiscountSection = currentStep >= 4

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <BookingHeader onClose={() => window.history.back()} />
      <BookingProgress currentStep={currentStep} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-12">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderStepContent()}
            </div>

            {currentStep < 5 && (
              <div className="flex items-center justify-between mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="rounded-full px-4 sm:px-6 h-10 sm:h-12 gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Quay lại</span><span className="sm:hidden">Lùi</span>
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={isNextDisabled()}
                  className="rounded-full px-5 sm:px-8 bg-primary hover:bg-primary/90 text-white h-10 sm:h-12 gap-1 sm:gap-2 shadow-lg shadow-primary/20 flex items-center text-sm sm:text-base"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Đang xử lý...</span><span className="sm:hidden">Xử lý...</span>
                    </>
                  ) : (
                    <>
                      {currentStep === 4 ? 'Thanh toán' : 'Tiếp tục'}
                      <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar Summary — Desktop: sticky bên phải, Mobile: dưới content */}
          {currentStep < 5 && (
            <div className="w-full lg:w-auto animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right-4 duration-700 delay-150">
              <BookingSummary
                movieTitle={movieTitle}
                selectedSchedule={selectedSchedule}
                selectedSeats={selectedSeats}
                cartItems={cartItems}
                total={totalAmount}
                voucherInput={voucherInput}
                setVoucherInput={setVoucherInput}
                appliedVoucher={appliedVoucher}
                voucherError={voucherError}
                isCheckingVoucher={isCheckingVoucher}
                handleApplyVoucher={handleApplyVoucher}
                handleClearVoucher={handleClearVoucher}
                subtotalAmount={subtotalAmount}
                totalAmount={totalAmount}

                user={user}
                pointsInput={pointsInput}
                setPointsInput={setPointsInput}
                appliedPointsDiscount={appliedPointsDiscount}
                pointsError={pointsError}
                isCheckingPoints={isCheckingPoints}
                handleApplyPoints={handleApplyPoints}
                handleClearPoints={handleClearPoints}

                showDiscountSection={showDiscountSection}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}