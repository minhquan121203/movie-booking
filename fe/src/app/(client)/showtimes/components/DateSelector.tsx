'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'

type DateSelectorProps = {
  selectedDate: string | undefined
  onSelectDate: (date: string | undefined) => void
}

export default function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const dates = useMemo(() => {
    const days = []
    const today = new Date()
    days.push({ label: 'Tất cả', date: 'All', value: undefined })
    for (let i = 0; i < 10; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      // Format để hiển thị (VD: Thứ 2, 24/11)
      const dayOfWeek =
        i === 0 ? 'Hôm nay' : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date)
      const dateStr = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
        date
      )

      // Format value để lưu state (YYYY-MM-DD) cho dễ so sánh/gọi API
      // Lưu ý: cẩn thận múi giờ, ở đây dùng toLocaleDateString('en-CA') để lấy YYYY-MM-DD theo local time
      const value = date.toLocaleDateString('vi-VN')

      days.push({ label: dayOfWeek, date: dateStr, value })
    }
    return days
  }, [])

  return (
    <Card className="bg-surface border-border p-3 sm:p-4" style={{ borderRadius: '16px' }}>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {dates.map(item => {
          const isSelected = selectedDate === item.value

          return (
            <button
              key={item.date}
              onClick={() => onSelectDate(item.value)}
              className={`shrink-0 min-w-20 px-3 py-2 rounded-xl transition-all border border-transparent ${
                isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-bg-secondary text-text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/20'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-xs font-medium mb-1 capitalize ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}
                >
                  {item.label}
                </div>
                <div className="text-base font-bold">{item.date}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
