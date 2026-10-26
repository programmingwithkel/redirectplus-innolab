import type { Urgency } from "../domain/types"

export const ROUTING_LIMITS = {
  /** Maximum straight-line search radius in meters for finding candidates */
  DEFAULT_SEARCH_RADIUS_METERS: 60_000, // 60 km
  EXTENDED_SEARCH_RADIUS_METERS: 120_000, // 120 km for tertiary/rare specialties

  /** Maximum candidate facilities to send to Google Routes Matrix (API limit per call is 25) */
  MAX_MATRIX_CANDIDATES: 20,

  /** Maximum alternatives to display on UI */
  MAX_DISPLAY_ALTERNATIVES: 5,

  /** Maximum excluded facilities to display */
  MAX_DISPLAY_EXCLUDED: 5,

  /** Soft upper bound travel duration in seconds after which urgency warning triggers */
  MAX_RECOMMENDED_TRAVEL_TIME_SECONDS: {
    EMERGENCY: 45 * 60, // 45 minutes
    URGENT: 90 * 60,    // 90 minutes
    ROUTINE: 180 * 60,  // 3 hours
  } as Record<Urgency, number>,

  /** Per-provider network timeouts so a slow provider never blocks the fallback chain */
  PROVIDER_TIMEOUT_MS: {
    MATRIX: 5000,
    ROUTE: 6000,
  },
}

/**
 * Parameters for the last-resort travel estimate (used only when no routing
 * provider responds). Results are always labeled APPROX_FALLBACK in the UI.
 */
export const TRAVEL_ESTIMATION = {
  /** Typical ratio of road distance to great-circle distance on provincial roads */
  ROAD_WINDING_FACTOR: 1.4,
  /** Conservative average driving speed for Bicol provincial roads */
  AVERAGE_SPEED_KPH: 35,
}
