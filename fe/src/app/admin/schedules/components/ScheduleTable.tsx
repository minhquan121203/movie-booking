import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Schedule } from '@/types/schedule'

interface ScheduleTableProps {
  schedules: Schedule[]
  isLoading: boolean
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}

export function ScheduleTable({ schedules, isLoading, onEdit, onDelete }: ScheduleTableProps) {
  if (isLoading) return <div className="text-center py-10">Đang tải...</div>
  if (schedules.length === 0)
    return (
      <div className="text-center py-10 text-gray-500">Chưa có lịch chiếu nào trong ngày này.</div>
    )

  return (
    <div className="bg-white border border-gray-200 text-gray-950 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50/50 ">
            <TableHead className="text-gray-800">Phim</TableHead>
            <TableHead className="text-gray-800">Rạp / Phòng</TableHead>
            <TableHead className="text-gray-800">Ngày / Giờ</TableHead>
            <TableHead className="text-gray-800">Giá Vé</TableHead>
            <TableHead className="text-gray-800">Ghế Trống</TableHead>
            <TableHead className="text-right text-gray-800">Thao Tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map(schedule => (
            <TableRow key={schedule._id} className="hover:bg-gray-50/50">
              <TableCell className="font-medium">{schedule.movie.title}</TableCell>
              <TableCell>
                <div className="text-sm">{schedule.theater.name}</div>
                <div className="text-xs text-gray-500">{schedule.roomName}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-semibold text-blue-600">
                  {schedule.startTime} - {schedule.endTime}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(schedule.showDate).toLocaleDateString('vi-VN')}
                </div>
              </TableCell>
              <TableCell>{schedule.ticketPrices.standard.toLocaleString()} đ</TableCell>
              <TableCell>
                <Badge
                  className={
                    schedule.availableSeatsCount < 20
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }
                >
                  {schedule.availableSeatsCount}/{schedule.totalSeats}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-blue-600"
                    onClick={() => onEdit(schedule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-red-600"
                    onClick={() => onDelete(schedule._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
