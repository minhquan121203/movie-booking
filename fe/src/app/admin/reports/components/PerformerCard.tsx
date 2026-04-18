import type { TopPerformer } from '../page'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const PerformerCard = ({
  icon: Icon,
  title,
  performers,
  valueLabel,
  iconColor,
  isLoading = false,
}: {
  icon: any
  title: string
  performers: TopPerformer[]
  valueLabel: string
  iconColor: string
  isLoading?: boolean
}) => (
  <div className="bg-card rounded-lg border border-border p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>

    {isLoading ? (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 bg-secondary/50 rounded-lg animate-pulse">
            <div className="h-10 bg-secondary rounded"></div>
          </div>
        ))}
      </div>
    ) : performers.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">Không có dữ liệu</div>
    ) : (
      <div className="space-y-3">
        {performers.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.subValue.toLocaleString('vi-VN')} {valueLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
              {item.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)
