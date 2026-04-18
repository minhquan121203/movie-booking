import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'
import { Theater } from '@/types/theater'
import { TheaterCombobox } from '@/components/ui/combobox'

interface RoomToolbarProps {
  search: string
  onSearchChange: (val: string) => void
  selectedTheater: string
  onTheaterChange: (val: string) => void
  theaters: Theater[]
  onOpenAdd: () => void
}

export function RoomToolbar({
  search,
  onSearchChange,
  selectedTheater,
  onTheaterChange,
  theaters,
  onOpenAdd,
}: RoomToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-1 flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm tên phòng..."
            className="pl-9 bg-gray-50 border-gray-200"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Theater - Thay Select bằng Combobox */}
        <div className="relative min-w-[250px]">
          <TheaterCombobox
            theaters={theaters}
            value={selectedTheater}
            onValueChange={onTheaterChange}
            placeholder="Lọc theo rạp"
            searchPlaceholder="Tìm kiếm rạp..."
          />
        </div>
      </div>

      <Button onClick={onOpenAdd} className="bg-primary hover:bg-primary/90 text-white gap-2">
        <Plus className="w-4 h-4" /> Thêm Phòng Mới
      </Button>
    </div>
  )
}
