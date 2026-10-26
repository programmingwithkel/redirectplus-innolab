import type { FreshnessGroup, Urgency } from "../domain/types"

/**
 * Maximum age in seconds before a record is considered STALE and drops to UNKNOWN.
 * Stricter thresholds apply for EMERGENCY cases.
 */
export const FRESHNESS_LIMITS_SECONDS: Record<
  FreshnessGroup,
  Record<Urgency, number>
> = {
  CRITICAL_CAPACITY: {
    // ED operational status, Trauma Team, OR, Ambulance
    EMERGENCY: 1 * 60 * 60, // 1 hour
    URGENT: 2 * 60 * 60,    // 2 hours
    ROUTINE: 4 * 60 * 60,   // 4 hours
  },
  BEDS: {
    // ICU Beds, Ward Beds, OB Beds
    EMERGENCY: 2 * 60 * 60, // 2 hours
    URGENT: 4 * 60 * 60,    // 4 hours
    ROUTINE: 8 * 60 * 60,   // 8 hours
  },
  EQUIPMENT_STAFF: {
    // CT scan, X-ray, Oxygen, On-call specialists
    EMERGENCY: 4 * 60 * 60, // 4 hours
    URGENT: 8 * 60 * 60,    // 8 hours
    ROUTINE: 24 * 60 * 60,  // 24 hours
  },
  OPERATING_STATUS: {
    // Overall facility open/closed
    EMERGENCY: 6 * 60 * 60, // 6 hours
    URGENT: 12 * 60 * 60,   // 12 hours
    ROUTINE: 24 * 60 * 60,  // 24 hours
  },
  SERVICE_VERIFICATION: {
    // Structural accreditation / verified service offerings
    EMERGENCY: 90 * 24 * 60 * 60, // 90 days
    URGENT: 90 * 24 * 60 * 60,
    ROUTINE: 90 * 24 * 60 * 60,
  },
}

export function isTimestampFresh(
  isoTimestamp: string | null | undefined,
  group: FreshnessGroup,
  urgency: Urgency,
  now: Date = new Date()
): boolean {
  if (!isoTimestamp) return false
  const time = new Date(isoTimestamp).getTime()
  if (isNaN(time)) return false

  const maxAgeSeconds = FRESHNESS_LIMITS_SECONDS[group][urgency]
  const elapsedSeconds = (now.getTime() - time) / 1000

  // Guard against future clock drift or negative elapsed time (allow up to 60s future drift)
  if (elapsedSeconds < -60) return false
  return elapsedSeconds <= maxAgeSeconds
}
