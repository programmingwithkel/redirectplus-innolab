import "server-only"
import { GoogleRouteMatrixProvider } from "../google-maps/route-matrix-provider"
import { GoogleRouteProvider } from "../google-maps/route-provider"
import { OsrmMatrixProvider, OsrmRouteProvider } from "../osrm/osrm-providers"
import { RecommendFacilitiesUseCase } from "./application/recommend-facilities"
import { VerifyFacilityAvailabilityUseCase } from "./application/verify-facility-availability"
import { FallbackRouteProvider, FallbackTravelTimeProvider } from "./infrastructure/fallback-providers"
import { SupabaseFacilityRepository } from "./infrastructure/supabase-facility-repository"
import { SupabaseRecommendationAuditLog } from "./infrastructure/supabase-recommendation-audit-log"
import { SupabaseRequirementProfileRepository } from "./infrastructure/supabase-requirement-profile-repository"

/**
 * Wires all infrastructure adapters and returns the routing use cases.
 *
 * Travel providers are chained: Google Routes → OSRM → straight-line estimate.
 * Each provider is tried in order; the first one that returns data wins.
 */
export function createRoutingServices() {
  const facilityRepo = new SupabaseFacilityRepository()
  const profileRepo = new SupabaseRequirementProfileRepository()
  const auditLog = new SupabaseRecommendationAuditLog()

  // Travel time: Google (traffic-aware) → OSRM (road-network) → math estimate
  const travelTimeProvider = new FallbackTravelTimeProvider([
    new GoogleRouteMatrixProvider(),
    new OsrmMatrixProvider(),
  ])

  // Route polylines: Google → OSRM
  const routeProvider = new FallbackRouteProvider([
    new GoogleRouteProvider(),
    new OsrmRouteProvider(),
  ])

  const recommendUseCase = new RecommendFacilitiesUseCase(
    facilityRepo,
    profileRepo,
    travelTimeProvider,
    auditLog
  )

  const verifyUseCase = new VerifyFacilityAvailabilityUseCase(
    facilityRepo,
    profileRepo
  )

  return {
    facilityRepo,
    profileRepo,
    travelTimeProvider,
    routeProvider,
    auditLog,
    recommendUseCase,
    verifyUseCase,
  }
}
