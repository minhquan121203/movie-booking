'use client'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ComplaintGuideline() {
  const guidelines = [
    'Ghi nhận đầy đủ thông tin khách hàng (nếu có)',
    'Chọn đúng loại vấn đề và mức độ ưu tiên',
    'Mô tả chi tiết tình huống',
    'Giữ thái độ lịch sự và chuyên nghiệp',
    'Cố gắng giải quyết ngay nếu có thể',
    'Nếu không có thông tin khách hàng, hệ thống sẽ tự động ghi nhận là báo cáo nội bộ',
  ]

  return (
    <Card className="p-6 border border-border rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-accent/10 rounded-[10px] flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-accent" />
        </div>
        <h3 className="text-foreground">Hướng dẫn</h3>
      </div>

      <ul className="space-y-3 text-sm text-muted-foreground">
        {guidelines.map((guideline, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>{guideline}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
