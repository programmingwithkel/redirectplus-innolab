import { describe, expect, it } from "vitest"
import type {
  FacilityRepository,
  RecommendationAuditLog,
  RecommendationRunRecord,
  RequirementProfileRepository,
  TravelTimeProvider,
} from "@/lib/routing/application/ports"
import { RecommendFacilitiesUseCase } from "@/lib/routing/application/recommend-facilities"
import type {
  CareRequirementProfile,
  FacilitySnapshot,
  GeoPoint,
  TravelLeg,
  TravelSource,
} from "@/lib/routing/domain/types"

class InMemoryFacilityRepo implements FacilityRepository {
  constructor(private facilities: FacilitySnapshot[]) {}

  async findActiveFacilitiesWithinRadius(): Promise<FacilitySnapshot[]> {
    return this.facilities
  }

  async getFacilitySnapshot(id: string): Promise<FacilitySnapshot | null> {
    return this.facilities.find((f) => f.id === id) || null
  }
}

class FakeProfileRepo implements RequirementProfileRepository {
  async getProfile(caseCategory: string): Promise<CareRequirementProfile | null> {
    if (caseCategory === "TRAUMA") {
      return {
        caseCategory: "TRAUMA",
        label: "Trauma Emergency",
        requiredServices: ["EMERGENCY_CARE", "TRAUMA_CARE"],
        mandatoryResources: ["ED_OPERATIONAL", "TRAUMA_TEAM"],
        requiresHospitalEmergency: true,
        isEmergencyCategory: true,
        version: 1,
        isClinicallyReviewed: true,
      }
    }
    return null
  }
}

class FakeTravelTimeProvider implements TravelTimeProvider {
  constructor(
    private matrix: Map<string, TravelLeg>,
    private source: TravelSource = "ROUTES_API"
  ) {}

  async computeTravelMatrix() {
    return {
      results: this.matrix,
      source: this.source,
    }
  }
}

class SpyAuditLog implements RecommendationAuditLog {
  public loggedRuns: RecommendationRunRecord[] = []

  async logRecommendationRun(record: RecommendationRunRecord): Promise<string | null> {
    this.loggedRuns.push(record)
    return "run-12345"
  }
}

describe("RecommendFacilitiesUseCase", () => {
  const now = new Date("2026-10-26T12:00:00Z")

  const hospA: FacilitySnapshot = {
    id: "hosp-a",
    name: "Hospital A",
    tier: "TERTIARY",
    address: "St A",
    municipality: "Daraga",
    province: "Albay",
    phone: "111",
    location: { lat: 13.15, lng: 123.69 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: now.toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "ER", capabilityLevel: "ADVANCED", isActive: true, lastVerifiedAt: now.toISOString() },
      { code: "TRAUMA_CARE", label: "Trauma", capabilityLevel: "ADVANCED", isActive: true, lastVerifiedAt: now.toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "ED", status: "AVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
      { type: "TRAUMA_TEAM", label: "Trauma Team", status: "UNAVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
    ],
    acceptance: [
      { caseCategory: "TRAUMA", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 3600000).toISOString() },
    ],
  }

  const hospB: FacilitySnapshot = {
    id: "hosp-b",
    name: "Hospital B",
    tier: "SECONDARY",
    address: "St B",
    municipality: "Legazpi",
    province: "Albay",
    phone: "222",
    location: { lat: 13.14, lng: 123.74 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: now.toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "ER", capabilityLevel: "STANDARD", isActive: true, lastVerifiedAt: now.toISOString() },
      { code: "TRAUMA_CARE", label: "Trauma", capabilityLevel: "STANDARD", isActive: true, lastVerifiedAt: now.toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "ED", status: "AVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
      { type: "TRAUMA_TEAM", label: "Trauma Team", status: "AVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
    ],
    acceptance: [
      { caseCategory: "TRAUMA", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 3600000).toISOString() },
    ],
  }

  it("orchestrates Steps A through E and records an audit run", async () => {
    const travelMap = new Map<string, TravelLeg>([
      ["hosp-a", { durationSeconds: 8 * 60, distanceMeters: 5000 }],
      ["hosp-b", { durationSeconds: 14 * 60, distanceMeters: 10000 }],
    ])

    const auditSpy = new SpyAuditLog()
    const useCase = new RecommendFacilitiesUseCase(
      new InMemoryFacilityRepo([hospA, hospB]),
      new FakeProfileRepo(),
      new FakeTravelTimeProvider(travelMap),
      auditSpy,
      { now: () => now }
    )

    const response = await useCase.execute({
      origin: { lat: 13.16, lng: 123.68 },
      caseCategory: "TRAUMA",
      urgency: "EMERGENCY",
      userId: "user-test-uuid",
      userFacilityId: "fac-test-uuid",
    })

    expect(response.ranking.outcome).toBe("RECOMMENDED")
    expect(response.ranking.recommended?.facility.id).toBe("hosp-b")
    expect(response.ranking.nearerExcluded).toHaveLength(1)
    expect(response.ranking.nearerExcluded[0].facility.id).toBe("hosp-a")
    expect(response.travelSource).toBe("ROUTES_API")
    expect(response.runId).toBe("run-12345")

    // Verifies audit logging
    expect(auditSpy.loggedRuns).toHaveLength(1)
    const run = auditSpy.loggedRuns[0]
    expect(run.recommendedFacilityId).toBe("hosp-b")
    expect(run.outcome).toBe("RECOMMENDED")
    expect(run.caseCategory).toBe("TRAUMA")
  })

  it("handles fallback travel mode when Google Routes API fails or key is missing", async () => {
    const auditSpy = new SpyAuditLog()
    const useCase = new RecommendFacilitiesUseCase(
      new InMemoryFacilityRepo([hospB]),
      new FakeProfileRepo(),
      new FakeTravelTimeProvider(new Map(), "APPROX_FALLBACK"),
      auditSpy,
      { now: () => now }
    )

    const response = await useCase.execute({
      origin: { lat: 13.16, lng: 123.68 },
      caseCategory: "TRAUMA",
      urgency: "EMERGENCY",
      userId: "user-test-uuid",
    })

    expect(response.ranking.outcome).toBe("RECOMMENDED")
    expect(response.travelSource).toBe("APPROX_FALLBACK")
    expect(response.ranking.recommended?.travel.source).toBe("APPROX_FALLBACK")
  })
})
