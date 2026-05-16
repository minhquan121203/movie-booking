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

export default function BookingPage() {
  const params = useParams()
  const movieId = params.id as string

  const searchParams = useSearchParams()
  const preSelectedScheduleId = searchParams.get('scheduleId') || undefined

  const movieTitle = 'Đặt vé xem phim'

  const { user } = useUserStore()

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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <BookingHeader onClose={() => window.history.back()} />
      <BookingProgress currentStep={currentStep} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          <div className="flex-1 min-w-0">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderStepContent()}
            </div>

            {currentStep < 5 && (
              <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="rounded-full px-6 h-12 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={isNextDisabled()}
                  className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white h-12 gap-2 shadow-lg shadow-primary/20 flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {currentStep === 4 ? 'Thanh toán' : 'Tiếp tục'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {currentStep < 5 && (
            <div className="hidden lg:block animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
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
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}