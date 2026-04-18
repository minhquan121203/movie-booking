'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Định nghĩa type Status như yêu cầu
export type BookingStatus = 'Chờ thanh toán' | 'Hoàn tất' | 'Đã hủy' | 'Đã sử dụng' | 'Hết hạn'

export interface FiltersProps {
  currentStatus: BookingStatus | 'all'
  onStatusChange: (status: BookingStatus | 'all') => void
  bookingsCount: number
  isLoading: boolean
}

export default function Filters({
  currentStatus,
  onStatusChange,
  bookingsCount,
  isLoading,
}: FiltersProps) {
  const statuses: (BookingStatus | 'all')[] = [
    'all',
    'Chờ thanh toán',
    'Hoàn tất',
    'Đã sử dụng',
    'Hết hạn',
    'Đã hủy',
  ]

  return (
    <Card className="bg-surface border-border p-4 mb-8 rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <label className="text-text-primary mb-2 block font-semibold text-sm">
            Trạng thái vé
          </label>
          <Tabs
            value={currentStatus}
            onValueChange={v => onStatusChange(v as BookingStatus | 'all')}
            className="w-full"
          >
            <TabsList className="bg-bg-secondary h-auto flex-wrap justify-start">
              {statuses.map(status => (
                <TabsTrigger
                  key={status}
                  value={status}
                  disabled={isLoading}
                  className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  {status === 'all' ? 'Tất cả' : status}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4 md:mt-0 min-w-[150px] text-right">
          <p className="text-text-secondary text-sm">
            {isLoading ? (
              <span>Đang tải...</span>
            ) : (
              <>
                Tìm thấy <span className="text-primary font-semibold text-lg">{bookingsCount}</span>{' '}
                vé
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  )
}
