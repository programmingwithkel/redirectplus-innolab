import { isTimestampFresh } from "../config/freshness-policy"
import type {
  AcceptanceRecord,
  AvailabilityState,
  FreshnessGroup,
  ResourceRecord,
  Urgency,
} from "./types"

/**
 * Derives the 3-state availability of a resource item.
 *
 * Rules:
 * 1. If status is UNAVAILABLE (and timestamp is known/not corrupted), it is CONFIRMED_UNAVAILABLE.
 * 2. If status is UNKNOWN, it is UNKNOWN.
 * 3. If timestamp is null, unparseable, or stale (older than freshness limit for the urgency), it drops to UNKNOWN.
 * 4. Only if status is AVAILABLE or LIMITED AND timestamp is fresh, it is CONFIRMED_AVAILABLE.
 */
export function deriveResourceAvailability(
  resource: ResourceRecord | null | undefined,
  urgency: Urgency,
  now: Date = new Date()
): {
  state: AvailabilityState
  isFresh: boolean
  reason: string
} {
  if (!resource) {
    return {
      state: "UNKNOWN",
      isFresh: false,
      reason: "Resource record does not exist",
    }
  }

  if (resource.status === "UNAVAILABLE") {
    return {
      state: "CONFIRMED_UNAVAILABLE",
      isFresh: isTimestampFresh(resource.updatedAt, resource.freshnessGroup, urgency, now),
      reason: `${resource.label} is confirmed unavailable`,
    }
  }

  if (resource.status === "UNKNOWN") {
    return {
      state: "UNKNOWN",
      isFresh: false,
      reason: `${resource.label} status is explicitly recorded as unknown`,
    }
  }

  const fresh = isTimestampFresh(resource.updatedAt, resource.freshnessGroup, urgency, now)
  if (!fresh) {
    return {
      state: "UNKNOWN",
      isFresh: false,
      reason: `${resource.label} availability record is stale or unverified`,
    }
  }

  return {
    state: "CONFIRMED_AVAILABLE",
    isFresh: true,
    reason: `${resource.label} is confirmed available`,
  }
}

/**
 * Derives the acceptance state for a given case category.
 *
 * Rules:
 * 1. If no record exists -> UNKNOWN
 * 2. If expires_at <= now -> UNKNOWN (expired acceptance)
 * 3. If status is NOT_ACCEPTING and not expired -> CONFIRMED_UNAVAILABLE
 * 4. If status is ACCEPTING or ACCEPTING_WITH_CONDITIONS and not expired -> CONFIRMED_AVAILABLE
 * 5. If status is UNKNOWN -> UNKNOWN
 */
export function deriveAcceptanceAvailability(
  acceptance: AcceptanceRecord | null | undefined,
  now: Date = new Date()
): {
  state: AvailabilityState
  isExpired: boolean
  reason: string
} {
  if (!acceptance) {
    return {
      state: "UNKNOWN",
      isExpired: false,
      reason: "No case acceptance record registered",
    }
  }

  if (acceptance.expiresAt) {
    const expiry = new Date(acceptance.expiresAt).getTime()
    if (!isNaN(expiry) && expiry <= now.getTime()) {
      return {
        state: "UNKNOWN",
        isExpired: true,
        reason: "Case acceptance confirmation has expired",
      }
    }
  }

  if (acceptance.status === "NOT_ACCEPTING") {
    return {
      state: "CONFIRMED_UNAVAILABLE",
      isExpired: false,
      reason: acceptance.reasonCode
        ? `Facility explicitly not accepting: ${acceptance.reasonCode}`
        : "Facility explicitly reported it cannot accept this patient case",
    }
  }

  if (acceptance.status === "ACCEPTING" || acceptance.status === "ACCEPTING_WITH_CONDITIONS") {
    return {
      state: "CONFIRMED_AVAILABLE",
      isExpired: false,
      reason:
        acceptance.status === "ACCEPTING_WITH_CONDITIONS"
          ? "Facility accepting with conditions"
          : "Facility confirmed accepting patient for this case",
    }
  }

  return {
    state: "UNKNOWN",
    isExpired: false,
    reason: "Facility acceptance status is unknown",
  }
}
