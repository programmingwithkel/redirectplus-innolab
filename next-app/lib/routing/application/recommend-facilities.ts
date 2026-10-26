import { ROUTING_LIMITS } from "../config/routing-limits"
import { evaluateFacility } from "../domain/evaluate-facility"
import { straightLineMeters } from "../domain/geo"
import { rankFacilities } from "../domain/rank-facilities"
import type {
  CareRequirement,
  GeoPoint,
  RankedFacility,
  RankingResult,
  TravelEstimate,
  TravelSource,
  Urgency,
} from "../domain/types"
import type {
  Clock,
  FacilityRepository,
  RecommendationAuditLog,
  RequirementProfileRepository,
  TravelDestination,
  TravelTimeProvider,
} from "./ports"

export interface RecommendFacilitiesRequest {
  origin: GeoPoint
  caseCategory: string
  urgency: Urgency
  extraRequiredResources?: string[]
  searchRadiusMeters?: number
  // User context for audit
  userId: string
  userFacilityId?: string | null
}

export interface RecommendFacilitiesResponse {
  ranking: RankingResult
  requirement: CareRequirement
  travelSource: TravelSource
  runId: string | null
}

export class RecommendFacilitiesUseCase {
  constructor(
    private readonly facilityRepo: FacilityRepository,
    private readonly profileRepo: RequirementProfileRepository,
    private readonly travelTimeProvider: TravelTimeProvider,
    private readonly auditLog: RecommendationAuditLog,
    private readonly clock: Clock = { now: () => new Date() }
  ) {}

  async execute(request: RecommendFacilitiesRequest): Promise<RecommendFacilitiesResponse> {
    const now = this.clock.now()

    // Step A: Identify patient's requirements
    const profile = await this.profileRepo.getProfile(request.caseCategory)
    if (!profile) {
      throw new Error(`Unknown clinical case category: ${request.caseCategory}`)
    }

    const mergedMandatoryResources = Array.from(
      new Set([
        ...profile.mandatoryResources,
        ...(request.extraRequiredResources || []),
      ])
    )

    const requirement: CareRequirement = {
      caseCategory: profile.caseCategory,
      caseLabel: profile.label,
      urgency: request.urgency,
      requiredServices: profile.requiredServices,
      mandatoryResources: mergedMandatoryResources,
      requiresHospitalEmergency: profile.requiresHospitalEmergency,
      profileVersion: profile.version,
      isClinicallyReviewed: profile.isClinicallyReviewed,
    }

    // Step B: Filter and evaluate hospitals within radius
    const radius =
      request.searchRadiusMeters ||
      (profile.requiresHospitalEmergency
        ? ROUTING_LIMITS.DEFAULT_SEARCH_RADIUS_METERS
        : ROUTING_LIMITS.DEFAULT_SEARCH_RADIUS_METERS)

    const candidates = await this.facilityRepo.findActiveFacilitiesWithinRadius(
      request.origin,
      radius
    )

    // Evaluate each candidate against clinical rules
    const evaluations = candidates.map((facility) =>
      evaluateFacility(facility, requirement, now)
    )

    // Step C: Calculate travel time and distance
    // Filter down to the top N closest candidates to query Routes Matrix API
    const withDistance = evaluations.map((evaluation) => {
      const slMeters = evaluation.facility.location
        ? straightLineMeters(request.origin, evaluation.facility.location)
        : null
      return { evaluation, slMeters }
    })

    // Sort by straight-line distance to cap candidates for Routes API
    withDistance.sort((a, b) => (a.slMeters ?? Infinity) - (b.slMeters ?? Infinity))
    const matrixCandidates = withDistance.slice(0, ROUTING_LIMITS.MAX_MATRIX_CANDIDATES)

    const destinations: TravelDestination[] = matrixCandidates
      .filter((c) => c.evaluation.facility.location !== null)
      .map((c) => ({
        id: c.evaluation.facility.id,
        location: c.evaluation.facility.location!,
      }))

    const { results: travelMap, source: travelSource } =
      await this.travelTimeProvider.computeTravelMatrix(request.origin, destinations)

    // Build RankedFacility list
    const maxTravelThreshold =
      ROUTING_LIMITS.MAX_RECOMMENDED_TRAVEL_TIME_SECONDS[request.urgency]

    const rankedList: RankedFacility[] = matrixCandidates.map(({ evaluation, slMeters }) => {
      const leg = travelMap.get(evaluation.facility.id)

      let travel: TravelEstimate
      if (leg) {
        travel = {
          durationSeconds: leg.durationSeconds,
          distanceMeters: leg.distanceMeters,
          source: travelSource,
        }
      } else {
        // Fallback or unrouted
        travel = {
          durationSeconds: null,
          distanceMeters: null,
          source: travelSource,
        }
      }

      const exceedsUrgency =
        travel.durationSeconds !== null && travel.durationSeconds > maxTravelThreshold

      return {
        ...evaluation,
        travel,
        straightLineMeters: slMeters,
        exceedsUrgencyTravelLimit: exceedsUrgency,
      }
    })

    // Step D: Recommend best hospital & alternatives
    const ranking = rankFacilities(rankedList)

    // Step E: Persist de-identified recommendation run (Audit)
    const runId = await this.auditLog.logRecommendationRun({
      requestedBy: request.userId,
      requesterFacilityId: request.userFacilityId || null,
      caseCategory: requirement.caseCategory,
      urgency: requirement.urgency,
      originLatitude: request.origin.lat,
      originLongitude: request.origin.lng,
      requirementSnapshot: {
        caseCategory: requirement.caseCategory,
        urgency: requirement.urgency,
        requiredServices: requirement.requiredServices,
        mandatoryResources: requirement.mandatoryResources,
        requiresHospitalEmergency: requirement.requiresHospitalEmergency,
        profileVersion: requirement.profileVersion,
        isClinicallyReviewed: requirement.isClinicallyReviewed,
      },
      candidatesSnapshot: rankedList.map((rf) => ({
        facilityId: rf.facility.id,
        facilityName: rf.facility.name,
        tier: rf.facility.tier,
        verdict: rf.verdict,
        primaryIssue: rf.primaryIssue,
        durationSeconds: rf.travel.durationSeconds,
        distanceMeters: rf.travel.distanceMeters,
        travelSource: rf.travel.source,
      })),
      recommendedFacilityId: ranking.recommended?.facility.id || null,
      outcome: ranking.outcome,
      travelSource,
      profileVersion: requirement.profileVersion,
    })

    return {
      ranking,
      requirement,
      travelSource,
      runId,
    }
  }
}
