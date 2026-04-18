export const KPIMetricCard = ({
  icon: Icon,
  value,
  label,
  description,
  gradient,
}: {
  icon: any
  value: string | number
  label: string
  description: string
  gradient: string
}) => (
  <div className={`${gradient} p-5 rounded-lg text-white shadow-sm`}>
    <div className="flex items-center justify-between mb-3">
      <Icon className="w-5 h-5 opacity-90" />
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <p className="text-sm font-medium opacity-95">{label}</p>
    <p className="text-xs opacity-75 mt-1">{description}</p>
  </div>
)
