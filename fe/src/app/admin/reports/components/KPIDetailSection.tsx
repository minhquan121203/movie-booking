import { SectionHeader } from './SectionHeader'
import { Target, Activity, Loader2, CheckCircle2, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { KPIMetricCard } from './KPIMetricCard'
import { User } from '@/types/user'
import { EmployeeKPIData } from '@/lib/api/dashboard'

interface KPIDetailSectionProps {
  employees: User[]
  selectedEmployeeId: string | null
  setSelectedEmployeeId: (id: string) => void
  kpiData: EmployeeKPIData | undefined
  isLoadingStaff: boolean
  isLoadingKPI: boolean
  isCalculating: boolean
  calculateKPI: () => void
  month: number
  year: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

export const KPIDetailSection = ({
  employees,
  selectedEmployeeId,
  setSelectedEmployeeId,
  kpiData,
  isLoadingStaff,
  isLoadingKPI,
  isCalculating,
  calculateKPI,
  month,
  year,
  onMonthChange,
  onYearChange,
}: KPIDetailSectionProps) => {
  // Default values if no KPI data
  const defaultKPI = {
    kpi: 0,
    completion: 0,
    shifts: 0,
    performance: 0,
  }

  const currentKPI = kpiData?.kpiData || defaultKPI

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Months in Vietnamese
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ]

  return (
    <section className="bg-card rounded-lg border border-border p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <SectionHeader icon={Target} title="KPI Nhân Viên" />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Employee Select */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Chọn nhân viên
          </label>
          {isLoadingStaff ? (
            <div className="w-full px-4 py-3 bg-background border border-border rounded-lg text-muted-foreground text-sm">
              Đang tải...
            </div>
          ) : employees.length === 0 ? (
            <div className="w-full px-4 py-3 bg-background border border-border rounded-lg text-muted-foreground text-sm">
              Không có nhân viên
            </div>
          ) : (
            <select
              value={selectedEmployeeId || ''}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Month Select */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Tháng</label>
          <select
            value={month}
            onChange={e => onMonthChange(Number(e.target.value))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Select */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Năm</label>
          <select
            value={year}
            onChange={e => onYearChange(Number(e.target.value))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>

        {/* Empty column for alignment */}
        <div className="hidden lg:block"></div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingKPI ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          </Card>
        ) : kpiData?.message === 'Chưa có dữ liệu KPI cho tháng này' ? (
          <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground text-center">
            <div>
              <p className="font-medium">Chưa có dữ liệu KPI cho tháng này</p>
            </div>
          </div>
        ) : (
          <>
            <KPIMetricCard
              icon={Target}
              value={currentKPI.kpi}
              label="Điểm KPI"
              description="Tổng hợp từ các chỉ số"
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <KPIMetricCard
              icon={CheckCircle2}
              value={`${currentKPI.completion}%`}
              label="Tỉ lệ hoàn thành"
              description="Nhiệm vụ được giao"
              gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <KPIMetricCard
              icon={Calendar}
              value={currentKPI.shifts}
              label="Số ca làm việc"
              description={`Tháng ${month}/${year}`}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <KPIMetricCard
              icon={Activity}
              value={`${currentKPI.performance}%`}
              label="Chỉ số hiệu suất"
              description="Đánh giá tổng thể"
              gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </>
        )}
      </div>
    </section>
  )
}
