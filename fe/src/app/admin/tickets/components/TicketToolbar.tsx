import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { GetAdminBookingsParams } from '@/lib/api/booking'

interface TicketToolbarProps {
  params: GetAdminBookingsParams
  setParams: (params: GetAdminBookingsParams) => void
}

export function TicketToolbar({ params, setParams }: TicketToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Tìm mã vé, tên khách hàng..."
          className="pl-9 bg-gray-50 border-gray-200 text-gray-900"
          value={params.search || ''}
          onChange={e => setParams({ ...params, search: e.target.value, page: 1 })}
        />
      </div>

      {/* Filter Status */}
      <Select
        value={params.status || 'all'}
        onValueChange={val =>
          setParams({ ...params, status: val === 'all' ? undefined : val, page: 1 })
        }
      >
        <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 text-gray-900">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent className="bg-gray-50">
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="Chờ thanh toán">Chờ thanh toán</SelectItem>
          <SelectItem value="Hoàn tất">Hoàn tất</SelectItem>
          <SelectItem value="Đã sử dụng">Đã sử dụng</SelectItem>
          <SelectItem value="Đã hủy">Đã hủy</SelectItem>
        </SelectContent>
      </Select>

      {/* Filter Date */}
      <Input
        type="date"
        className="w-auto bg-gray-50 border-gray-200 text-gray-900"
        value={params.showDate || ''}
        onChange={e => setParams({ ...params, showDate: e.target.value, page: 1 })}
      />
    </div>
  )
}
