'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Ticket,
  Users,
  Film,
  AlertCircle,
  RefreshCcw,
  TrendingUp,
  MapPin,
} from 'lucide-react'
import { DashboardSummary } from '@/lib/api/dashboard'
import { LucideIcon } from 'lucide-react'

interface KpiStatsProps {
  summary: DashboardSummary | null | undefined
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  'dollar-sign': DollarSign,
  ticket: Ticket,
  users: Users,
  film: Film,
  'trending-up': TrendingUp,
}

// Default icons nếu API không trả về
const defaultIcons = [Users, Film, MapPin, Ticket, DollarSign]

// Color palette cho các cards
const colorPalette = [
  { text: 'text-blue-600', bg: 'bg-blue-100' },
  { text: 'text-purple-600', bg: 'bg-purple-100' },
  { text: 'text-orange-600', bg: 'bg-orange-100' },
  { text: 'text-cyan-600', bg: 'bg-cyan-100' },
  { text: 'text-green-600', bg: 'bg-green-100' },
]

export function KpiStats({ summary, isLoading, isError, error }: KpiStatsProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="border-none shadow-sm bg-white h-[140px]">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="border-red-100 bg-red-50/50 h-[140px]">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-red-600 text-sm text-center font-medium">Không thể tải dữ liệu</p>
              {error && (
                <p className="text-red-500 text-xs text-center mt-1">
                  {error.message || 'Đã xảy ra lỗi'}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                Thử lại
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // No data state
  if (!summary || !summary.cards || summary.cards.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="border-gray-200 bg-gray-50 h-[140px]">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm text-center">Chưa có dữ liệu</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Render cards từ API
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      {summary.cards.map((card, index) => {
        // Get icon từ API hoặc dùng default
        const IconComponent = card.icon
          ? iconMap[card.icon] || defaultIcons[index % defaultIcons.length]
          : defaultIcons[index % defaultIcons.length]

        const styles = colorPalette[index % colorPalette.length]
        return (
          <div key={index}>
            <Card
              className={`border-none shadow-sm hover:shadow-md transition-shadow ${styles.bg} overflow-hidden relative h-full`}
            >
              {/* Background Icon */}
              <div className={`absolute top-0 right-0 p-3 opacity-10 ${styles.text}`}>
                <IconComponent className={`w-24 h-24 `} />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-gray-900">
                  {typeof card.value === 'number' ? card.value.toLocaleString('vi-VN') : card.value}
                </div>
                <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className={`font-normal ${
                      String(card.subLabel).startsWith('+')
                        ? 'text-green-600 bg-green-50'
                        : String(card.subLabel).startsWith('-')
                          ? 'text-red-600 bg-red-50'
                          : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {card.subLabel}
                  </Badge>
                  {card.description}
                </span>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
