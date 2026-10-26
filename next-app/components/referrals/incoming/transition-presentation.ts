import { CheckCircle, Eye, Flag, Play, XCircle, type LucideIcon } from "lucide-react"
import type { ReferralStatus } from "@/lib/constants/referral-status"

export interface TransitionPresentation {
  label: string
  icon: LucideIcon
  destructive?: boolean
  /** Ask for confirmation and a reason before applying. */
  requiresReason?: boolean
}

/**
 * UI presentation for each receiver transition. Which transitions are
 * *allowed* is decided by the domain policy. This file only says how they look.
 */
export const TRANSITION_PRESENTATION: Partial<Record<ReferralStatus, TransitionPresentation>> = {
  ACKNOWLEDGED: { label: "Acknowledge", icon: Eye },
  ACCEPTED: { label: "Accept", icon: CheckCircle },
  DECLINED: { label: "Decline", icon: XCircle, destructive: true, requiresReason: true },
  IN_PROGRESS: { label: "Start treatment", icon: Play },
  COMPLETED: { label: "Complete", icon: Flag },
}
