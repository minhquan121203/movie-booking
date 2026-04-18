'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { Package, DollarSign, TrendingUp, Loader2 } from 'lucide-react'
import {
  useProductSales,
  transformProductSalesForChart,
  calculateProductSalesTotals,
} from '@/lib/api/dashboard'

interface ProductSalesSectionProps {
  selectedYear: number
  onYearChange: (year: number) => void
}

export function ProductSalesSection({ selectedYear, onYearChange }: ProductSalesSectionProps) {
  const currentYear = new Date().getFullYear()

  // Fetch data
  const { data, isLoading } = useProductSales({
    year: selectedYear,
  })

  // Transform data
  const chartData = transformProductSalesForChart(data)
  const totals = calculateProductSalesTotals(data)

  // Year options
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Thống kê sản phẩm</h2>
          <p className="text-muted-foreground mt-1">Doanh thu và số lượng bán theo tháng</p>
        </div>

        {/* Year Filter */}
        <Select
          value={selectedYear.toString()}
          onValueChange={value => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </Card>
      )}

      {/* Content */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="space-y-4">
            {/* Total Revenue Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totals.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Triệu VNĐ</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-green-600 bg-green-100">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  TB: {totals.avgRevenue.toFixed(2)}M/tháng
                </Badge>
              </div>
            </Card>

            {/* Total Quantity Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng số lượng</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totals.totalQuantity.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sản phẩm</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  TB: {Math.round(totals.avgQuantity)}/tháng
                </Badge>
              </div>
            </Card>

            {/* Data Table */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top 5 tháng cao nhất</h3>
              <div className="space-y-2">
                {chartData
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map((row, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.month}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-600">
                          {row.revenue.toFixed(2)}M
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium text-blue-600">{row.quantity}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Bar Chart */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Doanh thu theo tháng</h3>
                <p className="text-sm text-muted-foreground">Đơn vị: Triệu VNĐ</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} Triệu VNĐ`, 'Doanh thu']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Quantity Line Chart */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Số lượng bán theo tháng</h3>
                <p className="text-sm text-muted-foreground">Đơn vị: Sản phẩm</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value: number) => [`${value} sản phẩm`, 'Số lượng']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Số lượng"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
