import "server-only"
import type { DrivingRoute, RouteProvider } from "../routing/application/ports"
import type { GeoPoint } from "../routing/domain/types"
import { callGoogleComputeRoutes } from "./routes-client"

export class GoogleRouteProvider implements RouteProvider {
  async getDrivingRoute(origin: GeoPoint, destination: GeoPoint): Promise<DrivingRoute | null> {
    const route = await callGoogleComputeRoutes(origin, destination)
    return route ? { ...route, source: "ROUTES_API" } : null
  }
}
