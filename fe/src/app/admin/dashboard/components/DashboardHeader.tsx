import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tổng Quan</h1>
        <p className="text-gray-500 mt-1">Chào mừng trở lại, Admin! Đây là báo cáo hôm nay.</p>
      </div>
      {/* <div className="flex items-center gap-3 bg-white p-1 rounded-xl border shadow-sm  text-gray-900">
        <Select defaultValue="year" >
          <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0 font-medium ">
            <SelectValue placeholder="Thời gian" />
          </SelectTrigger>
          <SelectContent className="bg-gray-50 text-gray-900">
            <SelectItem value="month">Tháng này</SelectItem>
            <SelectItem value="quarter">Quý này</SelectItem>
            <SelectItem value="year">Năm nay</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="rounded-lg bg-primary text-white hover:bg-primary/90 shadow-none">
          <Filter className="w-4 h-4 mr-2" /> Lọc
        </Button>
      </div> */}
    </div>
  )
}
