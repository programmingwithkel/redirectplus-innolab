import { evaluateFacility } from "../domain/evaluate-facility"
import type {
  CareRequirement,
  FacilityEvaluation,
  Urgency,
} from "../domain/types"
import type {
  Clock,
  FacilityRepository,
  RequirementProfileRepository,
} from "./ports"

export class VerifyFacilityAvailabilityUseCase {
  constructor(
    private readonly facilityRepo: FacilityRepository,
    private readonly profileRepo: RequirementProfileRepository,
    private readonly clock: Clock = { now: () => new Date() }
  ) {}

  async execute(params: {
    facilityId: string
    caseCategory: string
    urgency: Urgency
    extraRequiredResources?: string[]
  }): Promise<{
    evaluation: FacilityEvaluation | null
    isAccepting: boolean
    hasConfirmedAvailability: boolean
  }> {
    const facility = await this.facilityRepo.getFacilitySnapshot(params.facilityId)
    if (!facility) {
      return { evaluation: null, isAccepting: false, hasConfirmedAvailability: false }
    }

    const profile = await this.profileRepo.getProfile(params.caseCategory)
    if (!profile) {
      return { evaluation: null, isAccepting: false, hasConfirmedAvailability: false }
    }

    const requirement: CareRequirement = {
      caseCategory: profile.caseCategory,
      caseLabel: profile.label,
      urgency: params.urgency,
      requiredServices: profile.requiredServices,
      mandatoryResources: Array.from(
        new Set([...profile.mandatoryResources, ...(params.extraRequiredResources || [])])
      ),
      requiresHospitalEmergency: profile.requiresHospitalEmergency,
      profileVersion: profile.version,
      isClinicallyReviewed: profile.isClinicallyReviewed,
    }

    const evaluation = evaluateFacility(facility, requirement, this.clock.now())

    return {
      evaluation,
      isAccepting: evaluation.verdict !== "EXCLUDED",
      hasConfirmedAvailability: evaluation.verdict === "CONFIRMED",
    }
  }
}
