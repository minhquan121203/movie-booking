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
import { GetProductsParams } from '@/lib/api/products'

interface ProductToolbarProps {
  params: GetProductsParams
  setParams: (params: Partial<GetProductsParams>) => void
  onOpenAdd: () => void
}

export function ProductToolbar({ params, setParams, onOpenAdd }: ProductToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900">
      {/* Left: Search & Filters */}
      <div className="flex flex-1 flex-col md:flex-row gap-3 overflow-x-auto pb-2 md:pb-0">
        <div className="relative min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-9 bg-gray-50 border-gray-200"
            value={params.search || ''}
            onChange={e => setParams({ search: e.target.value })}
          />
        </div>

        <Select
          value={params.category || 'all'}
          onValueChange={val => setParams({ category: val === 'all' ? undefined : (val as any) })}
        >
          <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent className="bg-gray-50 text-gray-900 border-gray-200">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            <SelectItem value="Popcorn">Bắp rang</SelectItem>
            <SelectItem value="Drink">Nước uống</SelectItem>
            <SelectItem value="Combo">Combo</SelectItem>
            <SelectItem value="Snack">Snack</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.sortBy || 'createdAt'}
          onValueChange={val => setParams({ sortBy: val })}
        >
          <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent className="bg-gray-50 text-gray-900 border-gray-200">
            <SelectItem value="createdAt">Mới nhất</SelectItem>
            <SelectItem value="price">Giá</SelectItem>
            <SelectItem value="name">Tên</SelectItem>
            <SelectItem value="totalSold">Bán chạy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: Add Button */}
      <Button onClick={onOpenAdd} className="bg-primary hover:bg-primary/90 text-white gap-2">
        <Plus className="w-4 h-4" /> Thêm sản phẩm
      </Button>
    </div>
  )
}
