'use client'

import { Search, Plus } from 'lucide-react'

interface Props {
  searchTerm: string
  setSearchTerm: (val: string) => void
  onAdd: () => void
}

export function VoucherToolbar({ searchTerm, setSearchTerm, onAdd }: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Tìm theo mã voucher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
        />
      </div>
      
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Thêm Mới
      </button>
    </div>
  )
}