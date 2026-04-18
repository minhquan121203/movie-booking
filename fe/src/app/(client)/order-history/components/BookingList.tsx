'use client'

import { useState } from 'react'
import BookingCard from './BookingCard'
import BookingDetailModal from './BookingDetailModal'
import { Card } from '@/components/ui/card'
import { Ticket } from 'lucide-react'
import type { Booking } from '@/types/booking'

interface BookingListProps {
  bookings: Booking[]
}

export default function BookingList({ bookings }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Nếu danh sách rỗng
  if (!bookings || bookings.length === 0) {
    return (
      <Card className="bg-surface border-border p-12 text-center rounded-xl mt-6">
        <Ticket className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
        <h3 className="text-text-primary mb-2 font-semibold text-xl">Không tìm thấy vé nào</h3>
        <p className="text-text-secondary">Không có lịch sử đặt vé cho trạng thái này.</p>
      </Card>
    )
  }

  return (
    <div>
      {/* Grid hiển thị danh sách */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bookings.map(b => (
          <BookingCard key={b._id} booking={b} onClick={() => setSelectedBooking(b)} />
        ))}
      </div>

      {/* Modal Chi tiết */}
      <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  )
}
