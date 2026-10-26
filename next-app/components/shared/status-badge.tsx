import { cn } from "@/lib/utils"
import {
  STATUS_COLORS,
  URGENCY_COLORS,
  type ReferralStatus,
  type UrgencyLevel,
} from "@/lib/constants/referral-status"
import { FACILITY_THEMES, type FacilityType } from "@/lib/constants/facility-themes"

export function StatusBadge({ status }: { status: ReferralStatus }) {
  const colors = STATUS_COLORS[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text
      )}
    >
      {status.replace("_", " ")}
    </span>
  )
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const colors = URGENCY_COLORS[urgency]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text
      )}
    >
      {urgency}
    </span>
  )
}

export function FacilityTypeBadge({
  type,
}: {
  type: string
}) {
  const theme = FACILITY_THEMES[type as FacilityType]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        !theme && "bg-gray-100 text-gray-800"
      )}
      style={theme ? { backgroundColor: theme.light, color: theme.dark } : undefined}
      title={theme?.label}
    >
      {type}
    </span>
  )
}
