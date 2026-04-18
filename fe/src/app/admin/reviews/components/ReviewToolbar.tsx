import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { GetReviewsParams } from '@/lib/api/reviews'

interface ReviewToolbarProps {
  params: GetReviewsParams
  setParams: (params: GetReviewsParams) => void
}

export function ReviewToolbar({ params, setParams }: ReviewToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Tìm theo người dùng hoặc tên phim..."
          className="pl-9 bg-gray-50 border-gray-200"
          value={params.search || ''}
          onChange={e => setParams({ ...params, search: e.target.value, page: 1 })}
        />
      </div>

      {/* Filter Status */}
      <Select
        value={params.status || 'all'}
        onValueChange={val =>
          setParams({ ...params, status: val === 'all' ? undefined : (val as any), page: 1 })
        }
      >
        <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="Chờ duyệt">⏳ Chờ duyệt</SelectItem>
          <SelectItem value="Đã duyệt">✅ Đã duyệt</SelectItem>
          <SelectItem value="Bị từ chối">❌ Bị từ chối</SelectItem>
        </SelectContent>
      </Select>

      {/* Filter Rating */}
      <Select
        value={params.rating?.toString() || 'all'}
        onValueChange={val =>
          setParams({ ...params, rating: val === 'all' ? undefined : Number(val), page: 1 })
        }
      >
        <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
          <SelectValue placeholder="Số sao" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả sao</SelectItem>
          <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
          <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
          <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
          <SelectItem value="2">⭐⭐ (2)</SelectItem>
          <SelectItem value="1">⭐ (1)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
