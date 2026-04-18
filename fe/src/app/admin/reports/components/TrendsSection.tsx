import { TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { SectionHeader } from './SectionHeader'
import { YearFilter } from '../../components/YearFilter'
import { usePerformanceTrend, useRevenueViews } from '@/lib/api/report'

interface TrendsSectionProps {
  selectedYear: number
  onYearChange: (year: number) => void
}

export const TrendsSection = ({ selectedYear, onYearChange }: TrendsSectionProps) => {
  const { data: performanceData, isLoading: isLoadingPerformance } =
    usePerformanceTrend(selectedYear)
  const { data: revenueData, isLoading: isLoadingRevenue } = useRevenueViews(selectedYear)

  // Transform performance trend data
  const performanceChartData =
    performanceData?.months.map(month => {
      const result: any = { month: month.tenThang }
      month.values.forEach(val => {
        result[val.name] = val.value
      })
      return result
    }) || []

  // Transform revenue views data
  const revenueChartData =
    revenueData?.months.map(month => {
      const result: any = { month: month.tenThang }
      month.values.forEach(val => {
        result[val.name] = val.value
      })
      return result
    }) || []

  return (
    <section className="bg-card rounded-lg border border-border p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          icon={TrendingUp}
          title="Xu Hướng Hiệu Suất"
          subtitle="Theo dõi sự thay đổi theo thời gian"
        />
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {performanceData?.title || 'Hiệu suất Nhân viên & Rạp'}
          </h3>
          {isLoadingPerformance ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Đang tải...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {performanceData?.months[0]?.values.map((val, idx) => (
                  <Line
                    key={val.name}
                    type="monotone"
                    dataKey={val.name}
                    stroke={idx === 0 ? '#3b82f6' : '#10b981'}
                    strokeWidth={2}
                    name={val.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {revenueData?.title || 'Doanh thu & Lượt xem'}
          </h3>
          {isLoadingRevenue ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Đang tải...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {revenueData?.months[0]?.values.map((val, idx) => (
                  <Bar
                    key={val.name}
                    dataKey={val.name}
                    fill={idx === 0 ? '#8b5cf6' : '#f59e0b'}
                    name={val.name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  )
}
