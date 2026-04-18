import { TrendingUp, AlertTriangle } from 'lucide-react'
import type { Alert } from '../page'
export const AlertItem = ({ alert }: { alert: Alert }) => {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'danger':
        return 'bg-red-50 border-l-red-500'
      case 'warning':
        return 'bg-yellow-50 border-l-yellow-500'
      default:
        return 'bg-blue-50 border-l-blue-500'
    }
  }

  const getIcon = () => {
    const iconClass =
      alert.type === 'danger'
        ? 'text-red-500'
        : alert.type === 'warning'
          ? 'text-yellow-500'
          : 'text-blue-500'

    return alert.type === 'info' ? (
      <TrendingUp className={`w-5 h-5 ${iconClass}`} />
    ) : (
      <AlertTriangle className={`w-5 h-5 ${iconClass}`} />
    )
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getAlertStyles()}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getIcon()}
            <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{alert.description}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
      </div>
    </div>
  )
}
