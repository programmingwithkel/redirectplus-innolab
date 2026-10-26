import type { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  accent?: boolean // Use facility accent color
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  accent = false,
}: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={
            accent
              ? {
                  backgroundColor: "var(--facility-light)",
                  color: "var(--facility-primary)",
                }
              : { backgroundColor: "#F3F4F6", color: "#6B7280" }
          }
        >
          {icon}
        </div>
      </div>
      <p
        className="mt-2 text-2xl font-semibold"
        style={accent ? { color: "var(--facility-primary)" } : undefined}
      >
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
