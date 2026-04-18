import { WorkSchedule } from '@/types/work-schedule'
import { Loader2, X } from 'lucide-react'
import { format, isSameMonth, isToday } from 'date-fns'

interface PlanningCalendarProps {
  isLoading: boolean
  calendarDays: Date[]
  monthStart: Date
  schedulesByDate: Map<string, WorkSchedule[]>
  onDeleteShift: (id: string) => void
}

export default function PlanningCalendar({
  isLoading,
  calendarDays,
  monthStart,
  schedulesByDate,
  onDeleteShift,
}: PlanningCalendarProps) {
  // Helper chọn màu (giữ nguyên logic cũ)
  const getShiftColor = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('sáng')) return 'border-l-blue-500 bg-blue-50 text-blue-700'
    if (lowerName.includes('chiều')) return 'border-l-orange-500 bg-orange-50 text-orange-700'
    if (lowerName.includes('tối') || lowerName.includes('đêm'))
      return 'border-l-purple-500 bg-purple-50 text-purple-700'
    return 'border-l-gray-500 bg-gray-50 text-gray-700'
  }

  const weekdayHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-400 border border-gray-100 rounded-2xl bg-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> Đang tải lịch...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-3">
      {/* Header Thứ */}
      {weekdayHeaders.map((d, i) => (
        <div
          key={i}
          className="text-center text-sm font-medium text-gray-400 py-2 uppercase tracking-wide"
        >
          {d}
        </div>
      ))}

      {/* Render Cells */}
      {calendarDays.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const daySchedules = schedulesByDate.get(dateKey) || []

        const isCurrentMonth = isSameMonth(day, monthStart)
        const dayClass = isCurrentMonth ? 'bg-white text-gray-900' : 'bg-gray-50/50 text-gray-400'
        const todayClass = isToday(day) ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-200' : ''

        return (
          <div
            key={dateKey}
            className={`min-h-[140px] border border-gray-100 rounded-xl p-2 flex flex-col gap-1.5 transition-all hover:shadow-md hover:border-indigo-100 group/cell ${dayClass} ${todayClass}`}
          >
            {/* Header Ngày */}
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-semibold ${isToday(day) ? 'text-indigo-600' : ''}`}>
                {format(day, 'dd/MM')}
              </span>
            </div>

            {/* Empty State */}
            {daySchedules.length === 0 && isCurrentMonth && (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg opacity-0 group-hover/cell:opacity-100 transition-opacity">
                <span className="text-[10px] text-gray-300 select-none">Trống</span>
              </div>
            )}

            {/* List Schedules */}
            <div className="space-y-1.5">
              {daySchedules.map((sch: WorkSchedule) => {
                const colorClass = getShiftColor(sch.shiftTemplateId.name)
                return (
                  <div
                    key={sch._id}
                    className={`relative group/item pl-2 py-1.5 pr-6 rounded-lg border border-l-4 text-xs ${colorClass} transition-all`}
                  >
                    <div className="font-bold truncate">{sch.shiftTemplateId.name}</div>
                    <div className="opacity-80 text-[10px] mt-0.5">
                      {sch.startTime} - {sch.endTime}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDeleteShift(sch._id)
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-white/80 rounded-full hover:text-red-500 transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
