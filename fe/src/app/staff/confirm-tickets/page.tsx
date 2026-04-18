'use client'

import { useState } from 'react'
import { TicketScanner } from './components/TicketScanner'
import { TicketInfoDisplay } from './components/TicketInfoDisplay'
import { type TicketStats } from './components/TicketStatsCards'
import type { TicketVerify } from '@/types/booking'
import { useNotification } from '@/providers/NotificationProvider'
import { useConfirmTicket } from './hooks/useConfirmTicket'

export default function ConfirmTicket() {
  const { showSuccess, showError } = useNotification()

  const [ticketInfo, setTicketInfo] = useState<TicketVerify | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const { confirmTicket } = useConfirmTicket()

  // Mock stats data - replace with real API
  const stats: TicketStats = {
    total: 245,
    valid: 238,
    invalid: 7,
  }

  // Handle ticket scan - now receives full Booking object from API
  const handleScanTicket = async (ticketData: TicketVerify) => {
    
    setTicketInfo(ticketData)
  }

  // Handle confirm entry
  const handleConfirmEntry = async () => {
    if (!ticketInfo) return
    setIsConfirming(true)
    try {
      confirmTicket.mutate(ticketInfo.booking.bookingCode)
      setTicketInfo(null)
    } catch (error) {
      console.error('Error confirming entry:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Kiểm tra & Xác nhận vé
        </h2>
        <p className="text-muted-foreground mt-1">Quét mã vé điện tử và xác nhận khách vào rạp</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketScanner onScan={handleScanTicket} />
        <TicketInfoDisplay
          ticket={ticketInfo}
          onConfirm={handleConfirmEntry}
          isConfirming={isConfirming}
        />
      </div>

      {/* Stats */}
      {/* <TicketStatsCards stats={stats} /> */}
    </div>
  )
}
