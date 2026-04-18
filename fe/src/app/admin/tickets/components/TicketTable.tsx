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
import { Edit, Trash2, Eye } from 'lucide-react'
import { Booking } from '@/types/booking'

interface TicketTableProps {
  bookings: Booking[]
  isLoading: boolean
  onEditStatus: (booking: Booking) => void
  onDelete: (id: string) => void
}

export function TicketTable({ bookings, isLoading, onEditStatus, onDelete }: TicketTableProps) {
  if (isLoading) return <div className="text-center py-10">Đang tải...</div>
  if (bookings.length === 0)
    return <div className="text-center py-10 text-gray-500">Không có vé nào.</div>

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn tất':
        return 'bg-green-100 text-green-700'
      case 'Chờ thanh toán':
        return 'bg-yellow-100 text-yellow-700'
      case 'Đã hủy':
        return 'bg-red-100 text-red-700'
      case 'Đã sử dụng':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50 text-gray-950">
          <TableRow>
            <TableHead>Mã Vé</TableHead>
            <TableHead>Thông tin Phim</TableHead>
            <TableHead>Khách Hàng</TableHead>
            <TableHead>Suất Chiếu</TableHead>
            <TableHead>Ghế</TableHead>
            <TableHead>Tổng Tiền</TableHead>
            <TableHead>Trạng Thái</TableHead>
            {/* <TableHead className="text-right">Thao Tác</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(ticket => (
            <TableRow key={ticket._id} className="hover:bg-gray-200/50 text-gray-950">
              <TableCell className="font-mono font-medium">
                {ticket.bookingCode || ticket._id.slice(-6).toUpperCase()}
              </TableCell>
              <TableCell>
                <div className="font-medium">{ticket.movieTitle}</div>
                <div className="text-xs text-gray-500">
                  {ticket.theaterName} - {ticket.roomName}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{ticket.customer?.fullName}</div>
                <div className="text-xs text-gray-500">{ticket.customer?.email}</div>
              </TableCell>
              <TableCell className="text-sm">
                {new Date(ticket.showDate).toLocaleDateString('vi-VN')} <br />
                {ticket.showTime}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {ticket.seats.map(s => s.seatNumber).join(', ')}
              </TableCell>
              <TableCell className="font-medium text-primary">
                {formatPrice(ticket.totalAmount)}
              </TableCell>
              <TableCell>
                <Badge className={`whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </Badge>
              </TableCell>
              {/* <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-blue-600"
                    onClick={() => onEditStatus(ticket)}
                    title="Cập nhật trạng thái"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-red-600"
                    onClick={() => onDelete(ticket._id)}
                    title="Xóa vé"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
