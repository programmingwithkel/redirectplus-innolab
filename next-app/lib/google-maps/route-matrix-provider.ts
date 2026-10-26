import "server-only"
import type {
  TravelDestination,
  TravelMatrixResult,
  TravelTimeProvider,
} from "../routing/application/ports"
import type { GeoPoint } from "../routing/domain/types"
import { callGoogleRouteMatrix } from "./routes-client"

/**
 * Live, traffic-aware travel times from Google Routes.
 * Returns an empty result when unavailable so a fallback provider can take over.
 */
export class GoogleRouteMatrixProvider implements TravelTimeProvider {
  async computeTravelMatrix(
    origin: GeoPoint,
    destinations: TravelDestination[]
  ): Promise<TravelMatrixResult> {
    const matrix = await callGoogleRouteMatrix(origin, destinations)
    return { results: matrix ?? new Map(), source: "ROUTES_API" }
  }
}
