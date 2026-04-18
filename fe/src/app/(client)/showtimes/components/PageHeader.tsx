type PageHeaderProps = {
  title: string
  subtitle: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h2
        className="text-text-primary mb-2"
        style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 600 }}
      >
        {title}
      </h2>
      <p className="text-text-secondary text-sm sm:text-base">{subtitle}</p>
    </div>
  )
}
