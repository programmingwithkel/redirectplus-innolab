// Referral status constants and valid transitions
// Used for both UI display and server-side transition validation

export const REFERRAL_STATUS = {
  PENDING: "PENDING",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DECLINED: "DECLINED",
  REDIRECTED: "REDIRECTED",
  CANCELLED: "CANCELLED",
} as const

export type ReferralStatus =
  (typeof REFERRAL_STATUS)[keyof typeof REFERRAL_STATUS]

export const REFERRAL_EVENT_TYPES = {
  CREATED: "CREATED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  IN_PROGRESS: "IN_PROGRESS",
  REDIRECTED: "REDIRECTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NOTE_ADDED: "NOTE_ADDED",
} as const

export type ReferralEventType =
  (typeof REFERRAL_EVENT_TYPES)[keyof typeof REFERRAL_EVENT_TYPES]

export const URGENCY_LEVELS = {
  ROUTINE: "ROUTINE",
  URGENT: "URGENT",
  EMERGENCY: "EMERGENCY",
} as const

export type UrgencyLevel = (typeof URGENCY_LEVELS)[keyof typeof URGENCY_LEVELS]

// Valid status transitions: from_status -> allowed_to_statuses
// Enforced on the server before any status update
export const VALID_STATUS_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  PENDING: ["ACKNOWLEDGED", "REDIRECTED", "CANCELLED"],
  ACKNOWLEDGED: ["ACCEPTED", "DECLINED", "REDIRECTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "REDIRECTED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "REDIRECTED", "CANCELLED"],
  COMPLETED: [], // terminal state
  DECLINED: [], // terminal state
  REDIRECTED: ["PENDING"], // system transition: resets to PENDING for new facility
  CANCELLED: [], // terminal state
}

// Active statuses (not terminal)
export const ACTIVE_STATUSES: ReferralStatus[] = [
  "PENDING",
  "ACKNOWLEDGED",
  "ACCEPTED",
  "IN_PROGRESS",
]

// Terminal statuses
export const TERMINAL_STATUSES: ReferralStatus[] = [
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
]

export function isValidTransition(
  currentStatus: ReferralStatus,
  newStatus: ReferralStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}

// Status badge colors for UI
export const STATUS_COLORS: Record<
  ReferralStatus,
  { bg: string; text: string }
> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
  ACKNOWLEDGED: { bg: "bg-blue-100", text: "text-blue-800" },
  ACCEPTED: { bg: "bg-green-100", text: "text-green-800" },
  IN_PROGRESS: { bg: "bg-indigo-100", text: "text-indigo-800" },
  COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-800" },
  DECLINED: { bg: "bg-red-100", text: "text-red-800" },
  REDIRECTED: { bg: "bg-purple-100", text: "text-purple-800" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-800" },
}

export const URGENCY_COLORS: Record<
  UrgencyLevel,
  { bg: string; text: string }
> = {
  ROUTINE: { bg: "bg-gray-100", text: "text-gray-700" },
  URGENT: { bg: "bg-orange-100", text: "text-orange-700" },
  EMERGENCY: { bg: "bg-red-100", text: "text-red-700" },
}
