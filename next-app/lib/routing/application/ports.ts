import type {
  CareRequirementProfile,
  FacilitySnapshot,
  GeoPoint,
  RecommendationOutcome,
  TravelLeg,
  TravelSource,
  Urgency,
} from "../domain/types"

export interface FacilityRepository {
  findActiveFacilitiesWithinRadius(
    origin: GeoPoint,
    radiusMeters: number
  ): Promise<FacilitySnapshot[]>

  getFacilitySnapshot(facilityId: string): Promise<FacilitySnapshot | null>
}

export interface TravelDestination {
  id: string
  location: GeoPoint
}

export interface TravelMatrixResult {
  /** Legs keyed by destination id. Destinations a provider could not route are absent. */
  results: Map<string, TravelLeg>
  source: TravelSource
}

export interface TravelTimeProvider {
  computeTravelMatrix(
    origin: GeoPoint,
    destinations: TravelDestination[]
  ): Promise<TravelMatrixResult>
}

export interface DrivingRoute {
  encodedPolyline: string
  durationSeconds: number
  distanceMeters: number
  source: TravelSource
}

export interface RouteProvider {
  getDrivingRoute(origin: GeoPoint, destination: GeoPoint): Promise<DrivingRoute | null>
}

export interface RecommendationRunRecord {
  requestedBy: string
  requesterFacilityId: string | null
  caseCategory: string
  urgency: Urgency
  originLatitude: number
  originLongitude: number
  requirementSnapshot: Record<string, unknown>
  candidatesSnapshot: Record<string, unknown>[]
  recommendedFacilityId: string | null
  outcome: RecommendationOutcome
  travelSource: TravelSource
  profileVersion: number
}

export interface RecommendationAuditLog {
  logRecommendationRun(record: RecommendationRunRecord): Promise<string | null>
}

export interface RequirementProfileRepository {
  getProfile(caseCategory: string): Promise<CareRequirementProfile | null>
}

export interface Clock {
  now(): Date
}
