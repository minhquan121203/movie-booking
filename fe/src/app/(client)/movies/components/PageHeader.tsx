'use client'

import { Button } from '@/components/ui/button'
import { Filter as FilterIcon } from 'lucide-react'

type PageHeaderProps = {
  showFilters: boolean
  onToggleFilters: () => void
}

export default function PageHeader({ showFilters, onToggleFilters }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-text-primary mb-2" style={{ fontSize: '32px', fontWeight: 600 }}>
          🎬 Danh sách phim
        </h2>
        <p className="text-text-secondary">Lọc và tìm kiếm phim theo sở thích của bạn</p>
      </div>
      <Button
        onClick={onToggleFilters}
        className="bg-primary hover:bg-primary/90 text-white rounded-lg"
      >
        <FilterIcon className="w-4 h-4 mr-2" />
        {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
      </Button>
    </div>
  )
}
