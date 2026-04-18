// app/(admin)/shift-manager/components/assignment-stats.tsx
import { Card } from '@/components/ui/card'
import { Clock, UserCheck, UserPlus, UserX } from 'lucide-react'

interface Summary {
  totalSchedules: number
  totalAssignments: number
  activeNow: number
  completed: number
  pending: number
  noShow: number
}

interface AssignmentStatsProps {
  summary: Summary
}

export default function AssignmentStats({ summary }: AssignmentStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-white border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 bg-green-50 rounded-lg text-green-600">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Đang làm việc</p>
          <p className="text-xl font-bold text-gray-800">{summary.activeNow}</p>
        </div>
      </Card>

      <Card className="bg-white border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Hoàn thành</p>
          <p className="text-xl font-bold text-gray-800">{summary.completed}</p>
        </div>
      </Card>

      <Card className="bg-white border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Chờ làm</p>
          <p className="text-xl font-bold text-gray-800">{summary.pending}</p>
        </div>
      </Card>

      <Card className="bg-white border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 bg-red-50 rounded-lg text-red-600">
          <UserX className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Vắng mặt</p>
          <p className="text-xl font-bold text-gray-800">{summary.noShow}</p>
        </div>
      </Card>
    </div>
  )
}
