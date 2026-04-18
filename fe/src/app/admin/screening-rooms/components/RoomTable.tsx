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
import { Edit, Trash2, Eye } from 'lucide-react' // Import thêm Eye
import { FlatRoom } from './RoomFormDialog'

interface RoomTableProps {
  rooms: FlatRoom[]
  isLoading: boolean
  onEdit: (room: FlatRoom) => void
  onDelete: (theaterId: string, roomId: string) => void
  onView: (room: FlatRoom) => void // Thêm prop onView
}

export function RoomTable({ rooms, isLoading, onEdit, onDelete, onView }: RoomTableProps) {
  if (isLoading) return <div className="text-center py-10">Đang tải...</div>
  if (rooms.length === 0)
    return <div className="text-center py-10 text-gray-500">Không tìm thấy phòng chiếu nào.</div>

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Tên Phòng</TableHead>
            <TableHead>Rạp</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Số Ghế</TableHead>
            <TableHead>Kích Thước</TableHead>
            <TableHead>Trạng Thái</TableHead>
            <TableHead className="text-right">Thao Tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map(room => (
            <TableRow key={room._id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell className="font-medium text-gray-900">{room.roomName}</TableCell>
              <TableCell className="text-gray-600">{room.theater.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {room.roomType}
                </Badge>
              </TableCell>
              <TableCell>{room.totalSeats}</TableCell>
              <TableCell className="text-gray-500 text-sm">
                {room.rows} hàng x {room.seatsPerRow} cột
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    room.isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }
                >
                  {room.isActive ? 'Hoạt động' : 'Bảo trì'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* Nút View Mới */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onView(room)}
                    title="Xem sơ đồ ghế"
                  >
                    <Eye className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(room)}
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(room.theater._id, room._id)}
                    title="Xóa phòng"
                  >
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
