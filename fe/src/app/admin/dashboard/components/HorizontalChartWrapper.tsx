'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HorizontalChart } from './HorizontalChart'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { YearFilter } from '../../components/YearFilter'

interface ChartData {
  name: string
  value: number
  color: string
  unit?: string
}

interface HorizontalChartWrapperProps {
  title: string
  description: string
  year?: number
  data: ChartData[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onYearChange?: (year: number) => void
  showYearFilter?: boolean
}

export function HorizontalChartWrapper({
  title,
  description,
  year,
  data,
  isLoading,
  isError,
  error,
  onYearChange,
  showYearFilter = true,
}: HorizontalChartWrapperProps) {
  return (
    <Card className="border-gray-100 shadow-sm h-full bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-800">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">{description}</CardDescription>
          </div>
          {showYearFilter && year && onYearChange && (
            <YearFilter selectedYear={year} onYearChange={onYearChange} label="Năm" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-9 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-red-600 text-sm font-medium mb-1">Không thể tải dữ liệu biểu đồ</p>
            {error && (
              <p className="text-red-500 text-xs mb-3">{error.message || 'Đã xảy ra lỗi'}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
            >
              <RefreshCcw className="w-3 h-3" />
              Thử lại
            </button>
          </div>
        ) : (
          <HorizontalChart data={data} />
        )}
      </CardContent>
    </Card>
  )
}
