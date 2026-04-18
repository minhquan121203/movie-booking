'use client'
import { useState, useMemo } from 'react'
import { TopPerformersSection } from './components/TopPerformersSection'
import { KPIDetailSection } from './components/KPIDetailSection'
import { TrendsSection } from './components/TrendsSection'
import { ComparisonSection } from './components/ComparisonSection'
import { AlertsSection } from './components/AlertsSection'
import { ProductSalesSection } from './components/ProductSalesSection'
import { useUsers } from '@/lib/api/user'
import { useEmployeeKPI } from '@/lib/api/dashboard'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
export interface TopPerformer {
  id: number
  name: string
  value: number
  subValue: number
  trend: 'up' | 'down'
}

export interface Alert {
  id: number
  type: 'warning' | 'danger' | 'info'
  title: string
  description: string
  time: string
}

// Mock Data for alerts only
export const MOCK_DATA = {
  alerts: [
    {
      id: 1,
      type: 'warning' as const,
      title: 'Giảm hiệu suất đột ngột',
      description: 'Lê Văn Cường: Hiệu suất giảm 12% trong 7 ngày qua',
      time: '2 giờ trước',
    },
    {
      id: 2,
      type: 'danger' as const,
      title: 'KPI dưới ngưỡng',
      description: 'Hoàng Văn Em: KPI đạt 78/100 (ngưỡng: 80)',
      time: '5 giờ trước',
    },
    {
      id: 3,
      type: 'warning' as const,
      title: 'Ca làm việc bất thường',
      description: 'Phạm Thị Dung: Vắng mặt 3/5 ca làm việc tuần này',
      time: '1 ngày trước',
    },
    {
      id: 4,
      type: 'info' as const,
      title: 'Xu hướng tích cực',
      description: 'Nguyễn Văn An: Tăng 8% hiệu suất trong tháng',
      time: '2 ngày trước',
    },
  ],
}

// Main Component
export default function Performance() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-indexed

  const [isCalculating, setIsCalculating] = useState(false)

  // Year states for different sections
  const [topPerformersYear, setTopPerformersYear] = useState(currentYear)
  const [trendsYear, setTrendsYear] = useState(currentYear)
  const [comparisonYear, setComparisonYear] = useState(currentYear)
  const [productSalesYear, setProductSalesYear] = useState(currentYear) // 🆕 Product sales year

  // 🟢 KPI filter states
  const [kpiMonth, setKpiMonth] = useState<number>(currentMonth)
  const [kpiYear, setKpiYear] = useState<number>(currentYear)

  // 🟢 Comparison filter states
  const [comparisonMonth, setComparisonMonth] = useState<number>(currentMonth)
  const [comparisonEmployeeIds, setComparisonEmployeeIds] = useState<string[]>([])

  // 🟢 Fetch staff users
  const { data: usersData, isFetching: isLoadingStaff } = useUsers({
    role: 'staff',
    limit: 100, // Get all staff
  })

  // 🟢 Selected employee state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  // 🟢 Auto-select first employee when data loads
  useMemo(() => {
    if (usersData?.users && usersData.users.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(usersData.users[0]._id)
    }
  }, [usersData, selectedEmployeeId])

  // 🟢 Fetch KPI data for selected employee with month/year
  const { data: kpiData, isLoading: isLoadingKPI } = useEmployeeKPI(
    selectedEmployeeId
      ? {
          employeeId: selectedEmployeeId,
          month: kpiMonth,
          year: kpiYear,
        }
      : undefined
  )

  const calculateKPI = () => {
    setIsCalculating(true)
    setTimeout(() => {
      setIsCalculating(false)
      alert('KPI đã được tính toán và cập nhật thành công!')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Hiệu Suất & KPI</h1>
          <p className="text-muted-foreground">
            Theo dõi và đánh giá hiệu suất làm việc, KPI nhân viên và xu hướng kinh doanh
          </p>
        </div>

        <TopPerformersSection
          selectedYear={topPerformersYear}
          onYearChange={setTopPerformersYear}
        />

        {isLoadingKPI ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          </Card>
        ) : (
          <KPIDetailSection
            employees={usersData?.users || []}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            kpiData={kpiData}
            isLoadingStaff={isLoadingStaff}
            isLoadingKPI={isLoadingKPI}
            isCalculating={isCalculating}
            calculateKPI={calculateKPI}
            month={kpiMonth}
            year={kpiYear}
            onMonthChange={setKpiMonth}
            onYearChange={setKpiYear}
          />
        )}

        <TrendsSection selectedYear={trendsYear} onYearChange={setTrendsYear} />

        <ComparisonSection
          selectedYear={comparisonYear}
          onYearChange={setComparisonYear}
          employees={usersData?.users || []}
          selectedEmployeeIds={comparisonEmployeeIds}
          onEmployeeIdsChange={setComparisonEmployeeIds}
          month={comparisonMonth}
          onMonthChange={setComparisonMonth}
          isLoadingStaff={isLoadingStaff}
        />

        {/* 🆕 Product Sales Section - Added after Comparison Section */}
        <ProductSalesSection selectedYear={productSalesYear} onYearChange={setProductSalesYear} />

        <AlertsSection />
      </div>
    </div>
  )
}
