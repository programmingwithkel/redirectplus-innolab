import { TRAVEL_ESTIMATION } from "../config/routing-limits"
import { straightLineMeters } from "./geo"
import type { GeoPoint, TravelLeg } from "./types"

const METERS_PER_KILOMETER = 1000
const SECONDS_PER_HOUR = 3600

/**
 * Last-resort driving estimate derived from straight-line distance.
 *
 * PURE. Only used when every routing provider is unavailable. Callers MUST
 * label the result as APPROX_FALLBACK so it is never mistaken for live routing.
 */
export function estimateTravelLeg(origin: GeoPoint, destination: GeoPoint): TravelLeg {
  const roadMeters =
    straightLineMeters(origin, destination) * TRAVEL_ESTIMATION.ROAD_WINDING_FACTOR
  const metersPerSecond =
    (TRAVEL_ESTIMATION.AVERAGE_SPEED_KPH * METERS_PER_KILOMETER) / SECONDS_PER_HOUR

  return {
    durationSeconds: Math.round(roadMeters / metersPerSecond),
    distanceMeters: Math.round(roadMeters),
  }
}
