import { Users, Search } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import { YearFilter } from '../../components/YearFilter'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  Bar,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { User } from '@/types/user'
import { useEmployeeComparison } from '@/lib/api/dashboard'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface ComparisonSectionProps {
  selectedYear: number
  onYearChange: (year: number) => void
  employees: User[]
  selectedEmployeeIds: string[]
  onEmployeeIdsChange: (ids: string[]) => void
  month: number
  onMonthChange: (month: number) => void
  isLoadingStaff: boolean
}

interface ComparisonDataRow {
  metric: string
  [key: string]: string | number
}

export const ComparisonSection = ({
  selectedYear,
  onYearChange,
  employees,
  selectedEmployeeIds,
  onEmployeeIdsChange,
  month,
  onMonthChange,
  isLoadingStaff,
}: ComparisonSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false)

  // Fetch comparison data
  const { data: comparisonData, isLoading: isLoadingComparison } = useEmployeeComparison(
    selectedEmployeeIds.length > 0
      ? {
          employeeIds: selectedEmployeeIds,
          month,
          year: selectedYear,
        }
      : null
  )

  // Filter employees by search query
  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle checkbox change
  const handleEmployeeToggle = (employeeId: string) => {
    if (selectedEmployeeIds.includes(employeeId)) {
      onEmployeeIdsChange(selectedEmployeeIds.filter(id => id !== employeeId))
    } else {
      if (selectedEmployeeIds.length < 5) {
        onEmployeeIdsChange([...selectedEmployeeIds, employeeId])
      }
    }
  }

  // Generate months
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

  // Transform API data to chart format
  const chartData: ComparisonDataRow[] = []
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

  if (comparisonData?.comparison) {
    const metrics = ['Sales', 'Service', 'Operations', 'Attendance', 'Quality']

    metrics.forEach(metric => {
      const row: ComparisonDataRow = { metric }
      comparisonData.comparison.forEach(emp => {
        row[emp.staffName] = emp.stats[metric as keyof typeof emp.stats]
      })
      chartData.push(row)
    })
  }

  const employeeNames = comparisonData?.comparison.map(emp => emp.staffName) || []

  // Get selected employee names for display
  const selectedEmployeeNames = employees
    .filter(emp => selectedEmployeeIds.includes(emp._id))
    .map(emp => emp.fullName)

  return (
    <section className="bg-card rounded-lg border border-border p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          icon={Users}
          title="So Sánh Hiệu Suất"
          subtitle="So sánh các chỉ số giữa nhiều nhân viên"
        />
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Employee Multi-Select */}
        <div className="md:col-span-2 relative">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Chọn nhân viên để so sánh (tối đa 5)
          </label>

          <div
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground cursor-pointer flex items-center justify-between"
            onClick={() => setShowEmployeeSelect(!showEmployeeSelect)}
          >
            <span className="text-sm">
              {selectedEmployeeIds.length === 0
                ? 'Chọn nhân viên...'
                : `${selectedEmployeeIds.length} nhân viên đã chọn`}
            </span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>

          {showEmployeeSelect && (
            <div className="absolute z-10 mt-2 w-full bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Employee List */}
              <div className="overflow-y-auto max-h-60">
                {isLoadingStaff ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Đang tải...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Không tìm thấy nhân viên
                  </div>
                ) : (
                  filteredEmployees.map(emp => (
                    <div
                      key={emp._id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleEmployeeToggle(emp._id)}
                    >
                      <Checkbox
                        checked={selectedEmployeeIds.includes(emp._id)}
                        disabled={
                          !selectedEmployeeIds.includes(emp._id) && selectedEmployeeIds.length >= 5
                        }
                      />
                      <span className="text-sm text-foreground">{emp.fullName}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selectedEmployeeIds.length}/5 đã chọn
                </span>
                <button
                  onClick={() => {
                    setShowEmployeeSelect(false)
                    setSearchQuery('')
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Employees Display */}
      {selectedEmployeeIds.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {selectedEmployeeNames.map((name, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-2"
            >
              {name}
              <button
                onClick={() =>
                  handleEmployeeToggle(employees.find(e => e.fullName === name)?._id || '')
                }
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Charts */}
      {isLoadingComparison ? (
        <div className="h-[320px] flex items-center justify-center">
          <div className="text-muted-foreground">Đang tải dữ liệu so sánh...</div>
        </div>
      ) : selectedEmployeeIds.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Chọn ít nhất 1 nhân viên để so sánh</p>
            <p className="text-sm mt-1">Bạn có thể chọn tối đa 5 nhân viên cùng lúc</p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">Không có dữ liệu</p>
            <p className="text-sm mt-1">Chưa có dữ liệu so sánh cho các nhân viên đã chọn</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">So sánh cột</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="metric" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {employeeNames.map((name, idx) => (
                  <Bar key={idx} dataKey={name} fill={colors[idx % colors.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">So sánh Radar</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <PolarRadiusAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {employeeNames.map((name, idx) => (
                  <Radar
                    key={idx}
                    name={name}
                    dataKey={name}
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.3}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}
