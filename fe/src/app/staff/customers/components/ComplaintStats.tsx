'use client'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface ComplaintStatsData {
  resolvedComplaints: number
  pendingComplaints: number
}

interface ComplaintStatsProps {
  stats: ComplaintStatsData
}

export default function ComplaintStats({ stats }: ComplaintStatsProps) {
  return (
    <Card className="p-6 border border-border rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-foreground">Thống kê</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-accent/10 rounded-[10px]">
          <span className="text-sm text-muted-foreground">Khiếu nại đã xử lý</span>
          <span className="text-accent font-semibold">{stats.resolvedComplaints} vấn đề</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-[10px]">
          <span className="text-sm text-muted-foreground">Chờ xử lý</span>
          <span className="text-destructive font-semibold">{stats.pendingComplaints} vấn đề</span>
        </div>
      </div>
    </Card>
  )
}
