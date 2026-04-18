import { Card } from '@/components/ui/card'
import { QrCode, CheckCircle2, XCircle } from 'lucide-react'

export interface TicketStats {
  total: number
  valid: number
  invalid: number
}

interface TicketStatsCardsProps {
  stats: TicketStats
}

export function TicketStatsCards({ stats }: TicketStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        label="Vé đã kiểm tra hôm nay"
        value={`${stats.total} vé`}
        icon={<QrCode className="w-6 h-6 text-primary" />}
        bgColor="bg-primary/10"
        textColor="text-foreground"
      />

      <StatCard
        label="Vé hợp lệ"
        value={`${stats.valid} vé`}
        icon={<CheckCircle2 className="w-6 h-6 text-chart-3" />}
        bgColor="bg-chart-3/10"
        textColor="text-chart-3"
      />

      <StatCard
        label="Vé không hợp lệ"
        value={`${stats.invalid} vé`}
        icon={<XCircle className="w-6 h-6 text-destructive" />}
        bgColor="bg-destructive/10"
        textColor="text-destructive"
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  bgColor: string
  textColor: string
}

function StatCard({ label, value, icon, bgColor, textColor }: StatCardProps) {
  return (
    <Card className="p-6 border border-border rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className={`${textColor} font-semibold mt-1`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-[10px] flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
