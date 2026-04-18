import { Card } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock, Film, MapPin } from 'lucide-react'
interface ScheduleStatsProp {
  total: number
  today: number
  current: number
  thearter: number
}
export function ScheduleStats() {
  // Mock data hoặc nhận props từ API thống kê nếu có
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={CalendarIcon}
        color="bg-blue-100 text-blue-600"
        label="Tổng Suất Chiếu"
        value="248"
      />
      <StatCard icon={Clock} color="bg-green-100 text-green-600" label="Hôm Nay" value="32" />
      <StatCard
        icon={Film}
        color="bg-orange-100 text-orange-600"
        label="Phim Đang Chiếu"
        value="15"
      />
      <StatCard
        icon={MapPin}
        color="bg-purple-100 text-purple-600"
        label="Rạp Hoạt Động"
        value="8"
      />
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value }: any) {
  return (
    <Card className="bg-white border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-gray-900 text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  )
}
