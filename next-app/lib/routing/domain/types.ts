// ============================================
// Smart Routing — Domain Types
// PURE: no framework, database, or network imports.
// Safe to import from both server and client code.
// ============================================

export type Urgency = "ROUTINE" | "URGENT" | "EMERGENCY"

export type FacilityTier = "BHS" | "RHU" | "SECONDARY" | "TERTIARY"

export type OperatingStatus = "OPERATIONAL" | "LIMITED_OPERATIONS" | "CLOSED" | "UNKNOWN"

export type ResourceStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN"

export type AcceptanceStatus =
  | "ACCEPTING"
  | "ACCEPTING_WITH_CONDITIONS"
  | "NOT_ACCEPTING"
  | "UNKNOWN"

/** Groups that share a freshness window. */
export type FreshnessGroup =
  | "CRITICAL_CAPACITY"
  | "BEDS"
  | "EQUIPMENT_STAFF"
  | "OPERATING_STATUS"
  | "SERVICE_VERIFICATION"

/** The three availability states. UNKNOWN is never shown as available. */
export type AvailabilityState = "CONFIRMED_AVAILABLE" | "CONFIRMED_UNAVAILABLE" | "UNKNOWN"

/**
 * Where a travel estimate came from, ordered from most to least reliable:
 * - ROUTES_API:      Google Routes, traffic-aware live driving time
 * - ROAD_NETWORK:    Road-graph routing (OSRM), real roads but no live traffic
 * - APPROX_FALLBACK: Straight-line distance × winding factor ÷ average speed
 */
export type TravelSource = "ROUTES_API" | "ROAD_NETWORK" | "APPROX_FALLBACK"

export type RecommendationOutcome = "RECOMMENDED" | "UNVERIFIED_ONLY" | "NONE"

export interface GeoPoint {
  lat: number
  lng: number
}

// -------------------------------------------
// Clinical requirement (Step A output)
// -------------------------------------------

export interface CareRequirementProfile {
  caseCategory: string
  label: string
  requiredServices: string[]
  mandatoryResources: string[]
  requiresHospitalEmergency: boolean
  isEmergencyCategory: boolean
  version: number
  isClinicallyReviewed: boolean
}

export interface CareRequirement {
  caseCategory: string
  caseLabel: string
  urgency: Urgency
  requiredServices: string[]
  mandatoryResources: string[]
  requiresHospitalEmergency: boolean
  profileVersion: number
  isClinicallyReviewed: boolean
}

// -------------------------------------------
// Facility snapshot (what the engine evaluates)
// -------------------------------------------

export interface ServiceRecord {
  code: string
  label: string
  capabilityLevel: "BASIC" | "STANDARD" | "ADVANCED"
  isActive: boolean
  lastVerifiedAt: string | null
}

export type ResourceFreshnessGroup = Exclude<FreshnessGroup, "OPERATING_STATUS" | "SERVICE_VERIFICATION">

export interface ResourceRecord {
  type: string
  label: string
  status: ResourceStatus
  quantity: number | null
  updatedAt: string | null
  freshnessGroup: ResourceFreshnessGroup
}

export interface AcceptanceRecord {
  caseCategory: string
  status: AcceptanceStatus
  reasonCode: string | null
  lastUpdatedAt: string
  expiresAt: string | null
}

export interface FacilitySnapshot {
  id: string
  name: string
  tier: FacilityTier
  address: string | null
  municipality: string | null
  province: string | null
  phone: string | null
  location: GeoPoint | null
  operatingStatus: OperatingStatus
  operatingStatusUpdatedAt: string | null
  isSampleData: boolean
  services: ServiceRecord[]
  resources: ResourceRecord[]
  acceptance: AcceptanceRecord[]
}

// -------------------------------------------
// Evaluation (Step B output)
// -------------------------------------------

export type RuleVerdict = "PASS" | "EXCLUDE" | "UNVERIFIED"

export type FindingCode =
  | "LOCATION_MISSING"
  | "OPERATIONAL"
  | "LIMITED_OPERATIONS"
  | "FACILITY_CLOSED"
  | "OPERATING_STATUS_UNVERIFIED"
  | "TIER_INSUFFICIENT_FOR_EMERGENCY"
  | "SERVICE_VERIFIED"
  | "SERVICE_MISSING"
  | "SERVICE_INACTIVE"
  | "SERVICE_UNVERIFIED"
  | "RESOURCE_CONFIRMED"
  | "RESOURCE_LIMITED"
  | "RESOURCE_UNAVAILABLE"
  | "RESOURCE_MISSING"
  | "RESOURCE_STALE"
  | "RESOURCE_UNKNOWN"
  | "ACCEPTING"
  | "ACCEPTING_WITH_CONDITIONS"
  | "NOT_ACCEPTING"
  | "ACCEPTANCE_MISSING"
  | "ACCEPTANCE_EXPIRED"
  | "ACCEPTANCE_UNKNOWN"

export interface Finding {
  code: FindingCode
  verdict: RuleVerdict
  /** Human-readable, safe-to-disclose explanation. */
  message: string
  /** The service/resource label this finding is about, if any. */
  subject?: string
  /** When the underlying record was last updated/verified. */
  recordedAt?: string | null
}

/** Final per-facility verdict after all rules. */
export type EvaluationVerdict = "CONFIRMED" | "UNVERIFIED" | "EXCLUDED"

/** Why an excluded facility was excluded — drives UI labels. */
export type ExclusionKind = "CAPABILITY" | "AVAILABILITY" | "OPERATIONAL" | "LOCATION"

export interface FacilityEvaluation {
  facility: FacilitySnapshot
  verdict: EvaluationVerdict
  exclusionKind: ExclusionKind | null
  /** First blocking finding (EXCLUDE first, else first UNVERIFIED). */
  primaryIssue: Finding | null
  /** PASS findings — "why it matches". */
  evidence: Finding[]
  /** EXCLUDE + UNVERIFIED findings. */
  issues: Finding[]
  /** Oldest timestamp among the evidence — the weakest link in the confirmation. */
  oldestEvidenceAt: string | null
}

// -------------------------------------------
// Travel + ranking (Steps C–E output)
// -------------------------------------------

export interface TravelLeg {
  durationSeconds: number
  distanceMeters: number
}

export interface TravelEstimate {
  durationSeconds: number | null
  distanceMeters: number | null
  source: TravelSource
}

export interface RankedFacility extends FacilityEvaluation {
  travel: TravelEstimate
  straightLineMeters: number | null
  exceedsUrgencyTravelLimit: boolean
}

export interface RankingResult {
  outcome: RecommendationOutcome
  recommended: RankedFacility | null
  alternatives: RankedFacility[]
  unverified: RankedFacility[]
  excluded: RankedFacility[]
  /** Facilities nearer than the recommendation that were excluded — explains "why not the closest". */
  nearerExcluded: RankedFacility[]
}
