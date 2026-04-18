'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TemplatesHeaderProps {
  onCreate: () => void
}

export default function TemplatesHeader({ onCreate }: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Cấu Hình Ca Mẫu</h3>
        <p className="text-sm text-gray-500">
          Định nghĩa các khung giờ làm việc chuẩn cho hệ thống.
        </p>
      </div>
      <Button
        onClick={onCreate}
        className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
      >
        <Plus className="w-4 h-4 mr-2" /> Thêm Mới
      </Button>
    </div>
  )
}
