import "server-only"
import type {
  DrivingRoute,
  RouteProvider,
  TravelDestination,
  TravelMatrixResult,
  TravelTimeProvider,
} from "../application/ports"
import type { GeoPoint } from "../domain/types"
import { estimateTravelLeg } from "../domain/travel-estimate"

// ── Composite Matrix ─────────────────────────────────────────────────────────

/**
 * Tries providers in priority order. As soon as one returns non-empty results,
 * those are used; remaining providers are not called.
 *
 * If every provider returns empty, builds a last-resort estimate from
 * straight-line distance so ranking always has _something_ to compare.
 */
export class FallbackTravelTimeProvider implements TravelTimeProvider {
  constructor(private readonly providers: TravelTimeProvider[]) {}

  async computeTravelMatrix(
    origin: GeoPoint,
    destinations: TravelDestination[]
  ): Promise<TravelMatrixResult> {
    for (const provider of this.providers) {
      const result = await provider.computeTravelMatrix(origin, destinations)
      if (result.results.size > 0) return result
    }

    // Last-resort: pure-math estimate
    const legs = new Map<string, { durationSeconds: number; distanceMeters: number }>()
    for (const dest of destinations) {
      legs.set(dest.id, estimateTravelLeg(origin, dest.location))
    }
    return { results: legs, source: "APPROX_FALLBACK" }
  }
}

// ── Composite Route ──────────────────────────────────────────────────────────

/**
 * Tries route providers in priority order until one returns a polyline.
 */
export class FallbackRouteProvider implements RouteProvider {
  constructor(private readonly providers: RouteProvider[]) {}

  async getDrivingRoute(origin: GeoPoint, destination: GeoPoint): Promise<DrivingRoute | null> {
    for (const provider of this.providers) {
      const result = await provider.getDrivingRoute(origin, destination)
      if (result) return result
    }
    return null
  }
}
