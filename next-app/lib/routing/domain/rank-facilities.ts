import { ROUTING_LIMITS } from "../config/routing-limits"
import type { RankedFacility, RankingResult } from "./types"

/**
 * Comparator to rank facilities.
 * Primary: Estimated driving travel time (durationSeconds)
 * Secondary / Fallback: Straight-line or route distance
 */
export function compareRankedFacilities(a: RankedFacility, b: RankedFacility): number {
  const durA = a.travel.durationSeconds
  const durB = b.travel.durationSeconds

  // If both have driving duration estimates, compare by duration
  if (durA !== null && durB !== null) {
    if (durA !== durB) return durA - durB
    // Tie breaker: route distance
    const distA = a.travel.distanceMeters ?? a.straightLineMeters ?? Infinity
    const distB = b.travel.distanceMeters ?? b.straightLineMeters ?? Infinity
    return distA - distB
  }

  // If one has duration and other doesn't, duration wins
  if (durA !== null && durB === null) return -1
  if (durA === null && durB !== null) return 1

  // Fallback: compare by straight line distance
  const distA = a.straightLineMeters ?? Infinity
  const distB = b.straightLineMeters ?? Infinity
  return distA - distB
}

export function rankFacilities(candidates: RankedFacility[]): RankingResult {
  const confirmed = candidates
    .filter((c) => c.verdict === "CONFIRMED")
    .sort(compareRankedFacilities)

  const unverified = candidates
    .filter((c) => c.verdict === "UNVERIFIED")
    .sort(compareRankedFacilities)

  const excluded = candidates
    .filter((c) => c.verdict === "EXCLUDED")
    .sort(compareRankedFacilities)

  if (confirmed.length > 0) {
    const recommended = confirmed[0]
    const alternatives = confirmed.slice(1, ROUTING_LIMITS.MAX_DISPLAY_ALTERNATIVES + 1)

    // Find excluded facilities that were geographically closer or faster than the recommended one
    const recDuration = recommended.travel.durationSeconds
    const recDist = recommended.straightLineMeters ?? Infinity

    const nearerExcluded = excluded.filter((ex) => {
      if (recDuration !== null && ex.travel.durationSeconds !== null) {
        return ex.travel.durationSeconds < recDuration
      }
      return (ex.straightLineMeters ?? Infinity) < recDist
    })

    return {
      outcome: "RECOMMENDED",
      recommended,
      alternatives,
      unverified: unverified.slice(0, ROUTING_LIMITS.MAX_DISPLAY_ALTERNATIVES),
      excluded: excluded.slice(0, ROUTING_LIMITS.MAX_DISPLAY_EXCLUDED),
      nearerExcluded,
    }
  }

  if (unverified.length > 0) {
    return {
      outcome: "UNVERIFIED_ONLY",
      recommended: null,
      alternatives: [],
      unverified: unverified.slice(0, ROUTING_LIMITS.MAX_DISPLAY_ALTERNATIVES),
      excluded: excluded.slice(0, ROUTING_LIMITS.MAX_DISPLAY_EXCLUDED),
      nearerExcluded: [],
    }
  }

  return {
    outcome: "NONE",
    recommended: null,
    alternatives: [],
    unverified: [],
    excluded: excluded.slice(0, ROUTING_LIMITS.MAX_DISPLAY_EXCLUDED),
    nearerExcluded: [],
  }
}
