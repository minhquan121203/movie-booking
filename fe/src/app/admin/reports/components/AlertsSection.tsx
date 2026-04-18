import { SectionHeader } from './SectionHeader'
import { AlertTriangle } from 'lucide-react'
import { AlertItem } from './AlertItem'
import { MOCK_DATA } from '../page'
import type { Alert } from '../page'

export const AlertsSection = () => (
  <section className="bg-card rounded-lg border border-border p-6">
    <SectionHeader
      icon={AlertTriangle}
      title="Cảnh Báo Hiệu Suất"
      subtitle="Các vấn đề cần được chú ý và xử lý"
    />
    <div className="space-y-3">
      Chức năng đang phát triển
      {/* {MOCK_DATA.alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))} */}
    </div>
  </section>
)
