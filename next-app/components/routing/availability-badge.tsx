import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Never"
  const time = new Date(dateString).getTime()
  if (isNaN(time)) return "Unknown"

  const diffSeconds = Math.round((Date.now() - time) / 1000)
  if (diffSeconds < 60) return "Just now"
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

export function AvailabilityBadge({
  state,
  lastUpdated,
  compact = false,
}: {
  state: "CONFIRMED" | "UNVERIFIED" | "UNAVAILABLE" | "EXCLUDED"
  lastUpdated?: string | null
  compact?: boolean
}) {
  const relative = formatRelativeTime(lastUpdated)

  if (state === "CONFIRMED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
        )}
        title={lastUpdated ? `Verified ${relative}` : "Confirmed available"}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>Confirmed Available</span>
        {!compact && lastUpdated && (
          <span className="text-[10px] text-emerald-600/80 font-normal ml-0.5">
            • {relative}
          </span>
        )}
      </span>
    )
  }

  if (state === "UNAVAILABLE" || state === "EXCLUDED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
        )}
      >
        <XCircle className="h-3.5 w-3.5 text-rose-600" />
        <span>Confirmed Unavailable</span>
      </span>
    )
  }

  // UNVERIFIED
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
      )}
      title="Availability information has not been verified recently or is unknown"
    >
      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
      <span>Unverified</span>
      {!compact && lastUpdated && (
        <span className="text-[10px] text-amber-600/80 font-normal ml-0.5">
          • {relative}
        </span>
      )}
    </span>
  )
}
