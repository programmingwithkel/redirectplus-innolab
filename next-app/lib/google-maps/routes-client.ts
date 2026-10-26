import "server-only"
import { fetchJsonWithTimeout } from "../http/fetch-json-with-timeout"
import { ROUTING_LIMITS } from "../routing/config/routing-limits"
import type { TravelDestination } from "../routing/application/ports"
import type { GeoPoint, TravelLeg } from "../routing/domain/types"

const ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
const COMPUTE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

interface GoogleMatrixElement {
  destinationIndex?: number
  status?: { code?: number }
  duration?: string
  distanceMeters?: number
}

interface GoogleComputeRoutesResponse {
  routes?: {
    duration?: string
    distanceMeters?: number
    polyline?: { encodedPolyline?: string }
  }[]
}

export interface GoogleRouteResult {
  encodedPolyline: string
  durationSeconds: number
  distanceMeters: number
}

function getApiKey(): string | null {
  return (
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    null
  )
}

/** Google encodes protobuf durations as strings such as "1234s". */
function parseDurationSeconds(duration: string | undefined): number {
  if (typeof duration !== "string") return 0
  return Number.parseInt(duration.replace("s", ""), 10) || 0
}

function toWaypoint(point: GeoPoint) {
  return { location: { latLng: { latitude: point.lat, longitude: point.lng } } }
}

function buildHeaders(apiKey: string, fieldMask: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fieldMask,
  }
}

/**
 * Calls Google Routes API computeRouteMatrix (REST v2)
 *
 * Sends ONLY coordinates. No patient identifiers or notes are sent.
 */
export async function callGoogleRouteMatrix(
  origin: GeoPoint,
  destinations: TravelDestination[],
  timeoutMs: number = ROUTING_LIMITS.PROVIDER_TIMEOUT_MS.MATRIX
): Promise<Map<string, TravelLeg> | null> {
  const apiKey = getApiKey()
  if (!apiKey || destinations.length === 0) return null

  const data = await fetchJsonWithTimeout<GoogleMatrixElement[]>(
    ROUTE_MATRIX_URL,
    {
      method: "POST",
      headers: buildHeaders(
        apiKey,
        "originIndex,destinationIndex,status,condition,duration,distanceMeters"
      ),
      body: JSON.stringify({
        origins: [{ waypoint: toWaypoint(origin) }],
        destinations: destinations.map((d) => ({ waypoint: toWaypoint(d.location) })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    },
    timeoutMs,
    "GoogleRoutes:matrix"
  )

  if (!Array.isArray(data)) return null

  const legs = new Map<string, TravelLeg>()
  for (const element of data) {
    const hasError = Boolean(element.status?.code)
    const destination =
      typeof element.destinationIndex === "number"
        ? destinations[element.destinationIndex]
        : undefined
    if (hasError || !destination) continue

    legs.set(destination.id, {
      durationSeconds: parseDurationSeconds(element.duration),
      distanceMeters: element.distanceMeters ?? 0,
    })
  }

  return legs
}

/**
 * Calls Google Routes API computeRoutes to get detailed driving polyline for navigation.
 */
export async function callGoogleComputeRoutes(
  origin: GeoPoint,
  destination: GeoPoint,
  timeoutMs: number = ROUTING_LIMITS.PROVIDER_TIMEOUT_MS.ROUTE
): Promise<GoogleRouteResult | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const data = await fetchJsonWithTimeout<GoogleComputeRoutesResponse>(
    COMPUTE_ROUTES_URL,
    {
      method: "POST",
      headers: buildHeaders(
        apiKey,
        "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
      ),
      body: JSON.stringify({
        origin: toWaypoint(origin),
        destination: toWaypoint(destination),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        polylineQuality: "OVERVIEW",
      }),
    },
    timeoutMs,
    "GoogleRoutes:computeRoutes"
  )

  const route = data?.routes?.[0]
  if (!route?.polyline?.encodedPolyline) return null

  return {
    encodedPolyline: route.polyline.encodedPolyline,
    durationSeconds: parseDurationSeconds(route.duration),
    distanceMeters: route.distanceMeters ?? 0,
  }
}
