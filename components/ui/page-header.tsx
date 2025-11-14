"use client"

interface PageHeaderProps {
  title: string | React.ReactNode
  description?: string | React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    // Flex container to align title/description and actions
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      {/* Title and Description */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {/* Actions Area */}
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  )
} 