import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, MapPin, Phone } from 'lucide-react'
import { Theater } from '@/types/theater'

interface TheaterTableProps {
  theaters: Theater[]
  isLoading: boolean
  onEdit: (theater: Theater) => void
  onDelete: (id: string) => void
}

export function TheaterTable({ theaters, isLoading, onEdit, onDelete }: TheaterTableProps) {
  if (isLoading) return <div className="text-center py-10 text-gray-500">Đang tải...</div>
  if (theaters.length === 0)
    return <div className="text-center py-10 text-gray-500">Không có dữ liệu.</div>

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Tên Rạp</TableHead>
            <TableHead>Địa Chỉ</TableHead>
            <TableHead>Thành Phố</TableHead>
            <TableHead>Liên Hệ</TableHead>
            <TableHead className="text-center">Phòng/Ghế</TableHead>
            <TableHead className="text-center">Trạng Thái</TableHead>
            <TableHead className="text-right">Hành Động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {theaters.map(theater => (
            <TableRow key={theater._id} className="hover:bg-gray-100/50">
              <TableCell className="font-medium text-gray-900">{theater.name}</TableCell>
              <TableCell className="max-w-[200px]">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{theater.address}</span>
                </div>
              </TableCell>
              <TableCell>{theater.city}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3 h-3" /> {theater.phoneNumber || '-'}
                </div>
              </TableCell>
              <TableCell className="text-center text-sm">
                <div className="font-medium">{theater.totalRooms || 0} phòng</div>
                <div className="text-gray-500 text-xs">~{theater.totalCapacity || 0} ghế</div>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  className={
                    theater.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }
                >
                  {theater.isActive ? 'Hoạt động' : 'Đóng cửa'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="outline" onClick={() => onEdit(theater)}>
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => onDelete(theater._id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
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
