import "server-only"
import { fetchJsonWithTimeout } from "../http/fetch-json-with-timeout"
import { ROUTING_LIMITS } from "../routing/config/routing-limits"
import type {
  DrivingRoute,
  RouteProvider,
  TravelDestination,
  TravelMatrixResult,
  TravelTimeProvider,
} from "../routing/application/ports"
import type { GeoPoint, TravelLeg } from "../routing/domain/types"

const OSRM_BASE = "https://router.project-osrm.org"

// ── OSRM response shapes ────────────────────────────────────────────────────

interface OsrmTableResponse {
  code: string
  durations?: (number | null)[][]
  distances?: (number | null)[][]
}

interface OsrmRouteResponse {
  code: string
  routes?: {
    geometry: string
    duration: number
    distance: number
  }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** OSRM expects lng,lat (reversed from GeoJSON lat,lng) */
function toCoord(p: GeoPoint): string {
  return `${p.lng},${p.lat}`
}

// ── Matrix Provider ──────────────────────────────────────────────────────────

/**
 * Road-network travel times from OSRM (free, no API key required).
 * Uses the public demo server — adequate for development and low-volume production.
 * Returns real road distances and durations but without live traffic weighting.
 */
export class OsrmMatrixProvider implements TravelTimeProvider {
  async computeTravelMatrix(
    origin: GeoPoint,
    destinations: TravelDestination[]
  ): Promise<TravelMatrixResult> {
    if (destinations.length === 0) {
      return { results: new Map(), source: "ROAD_NETWORK" }
    }

    const coords = [toCoord(origin), ...destinations.map((d) => toCoord(d.location))].join(";")
    const url = `${OSRM_BASE}/table/v1/driving/${coords}?sources=0&annotations=duration,distance`

    const data = await fetchJsonWithTimeout<OsrmTableResponse>(
      url,
      { method: "GET", headers: { "User-Agent": "RescuePlus/1.0" } },
      ROUTING_LIMITS.PROVIDER_TIMEOUT_MS.MATRIX,
      "OSRM:table"
    )

    if (data?.code !== "Ok" || !data.durations?.[0] || !data.distances?.[0]) {
      return { results: new Map(), source: "ROAD_NETWORK" }
    }

    const legs = new Map<string, TravelLeg>()
    const durations = data.durations[0]
    const distances = data.distances[0]

    for (let i = 0; i < destinations.length; i++) {
      const dur = durations[i + 1] // index 0 is origin→origin
      const dist = distances[i + 1]
      if (dur != null && dist != null) {
        legs.set(destinations[i].id, {
          durationSeconds: Math.round(dur),
          distanceMeters: Math.round(dist),
        })
      }
    }

    return { results: legs, source: "ROAD_NETWORK" }
  }
}

// ── Route Provider (polyline) ────────────────────────────────────────────────

export class OsrmRouteProvider implements RouteProvider {
  async getDrivingRoute(origin: GeoPoint, destination: GeoPoint): Promise<DrivingRoute | null> {
    const coords = `${toCoord(origin)};${toCoord(destination)}`
    const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=polyline`

    const data = await fetchJsonWithTimeout<OsrmRouteResponse>(
      url,
      { method: "GET", headers: { "User-Agent": "RescuePlus/1.0" } },
      ROUTING_LIMITS.PROVIDER_TIMEOUT_MS.ROUTE,
      "OSRM:route"
    )

    const route = data?.routes?.[0]
    if (!route) return null

    return {
      encodedPolyline: route.geometry,
      durationSeconds: Math.round(route.duration),
      distanceMeters: Math.round(route.distance),
      source: "ROAD_NETWORK",
    }
  }
}
