export const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any
  title: string
  subtitle?: string
}) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
)
