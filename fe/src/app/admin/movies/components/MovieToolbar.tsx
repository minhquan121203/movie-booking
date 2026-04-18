import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'
import { GetMoviesParams } from '@/lib/api/movies'

interface MovieToolbarProps {
  params: GetMoviesParams
  setParams: (params: GetMoviesParams) => void
  onOpenAdd: () => void
}

export function MovieToolbar({ params, setParams, onOpenAdd }: MovieToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900">
      {/* Left: Search & Filters */}
      <div className="flex flex-1 flex-col md:flex-row gap-3 overflow-x-auto pb-2 md:pb-0">
        <div className="relative min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm phim..."
            className="pl-9 bg-gray-50 border-gray-200"
            value={params.search || ''}
            onChange={e => setParams({ ...params, search: e.target.value, page: 1 })}
          />
        </div>

        <Select
          value={params.status || 'all'}
          onValueChange={val =>
            setParams({ ...params, status: val === 'all' ? undefined : val, page: 1 })
          }
        >
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200 ">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-gray-50 text-gray-900 border-gray-200">
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Đang chiếu">Đang chiếu</SelectItem>
            <SelectItem value="Sắp chiếu">Sắp chiếu</SelectItem>
            <SelectItem value="Ngừng chiếu">Ngừng chiếu</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.sortBy || 'createdAt'}
          onValueChange={val => setParams({ ...params, sortBy: val })}
        >
          <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent className="bg-gray-50 text-gray-900 border-gray-200">
            <SelectItem value="createdAt">Mới nhất</SelectItem>
            <SelectItem value="viewCount">Lượt xem</SelectItem>
            <SelectItem value="averageRating">Đánh giá</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: Add Button */}
      <Button onClick={onOpenAdd} className="bg-primary hover:bg-primary/90 text-white gap-2">
        <Plus className="w-4 h-4" /> Thêm phim
      </Button>
    </div>
  )
}
