import { describe, expect, it } from "vitest"
import { deriveAcceptanceAvailability, deriveResourceAvailability } from "@/lib/routing/domain/availability"
import { evaluateFacility } from "@/lib/routing/domain/evaluate-facility"
import { rankFacilities } from "@/lib/routing/domain/rank-facilities"
import type {
  CareRequirement,
  FacilitySnapshot,
  RankedFacility,
} from "@/lib/routing/domain/types"

describe("Smart Routing Domain - Availability Derivation", () => {
  const baseTime = new Date("2026-10-26T12:00:00Z")

  it("marks resource fresh within urgency limit as CONFIRMED_AVAILABLE", () => {
    const res = deriveResourceAvailability(
      {
        type: "TRAUMA_TEAM",
        label: "Trauma Team",
        status: "AVAILABLE",
        quantity: null,
        freshnessGroup: "CRITICAL_CAPACITY",
        updatedAt: new Date(baseTime.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      },
      "EMERGENCY",
      baseTime
    )

    expect(res.state).toBe("CONFIRMED_AVAILABLE")
    expect(res.isFresh).toBe(true)
  })

  it("marks resource older than freshness limit as UNKNOWN (stale)", () => {
    const res = deriveResourceAvailability(
      {
        type: "TRAUMA_TEAM",
        label: "Trauma Team",
        status: "AVAILABLE",
        quantity: null,
        freshnessGroup: "CRITICAL_CAPACITY",
        updatedAt: new Date(baseTime.getTime() - 90 * 60 * 1000).toISOString(), // 90 mins ago (limit is 60m for EMERGENCY)
      },
      "EMERGENCY",
      baseTime
    )

    expect(res.state).toBe("UNKNOWN")
    expect(res.isFresh).toBe(false)
  })

  it("marks UNAVAILABLE resource as CONFIRMED_UNAVAILABLE regardless of freshness", () => {
    const res = deriveResourceAvailability(
      {
        type: "ICU_BED",
        label: "ICU Bed",
        status: "UNAVAILABLE",
        quantity: 0,
        freshnessGroup: "BEDS",
        updatedAt: new Date(baseTime.getTime() - 10 * 60 * 1000).toISOString(),
      },
      "EMERGENCY",
      baseTime
    )

    expect(res.state).toBe("CONFIRMED_UNAVAILABLE")
  })

  it("derives acceptance status and handles expiration", () => {
    const activeAcceptance = deriveAcceptanceAvailability(
      {
        caseCategory: "TRAUMA",
        status: "ACCEPTING",
        reasonCode: null,
        lastUpdatedAt: new Date(baseTime.getTime() - 10 * 60 * 1000).toISOString(),
        expiresAt: new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString(), // +1 hr
      },
      baseTime
    )
    expect(activeAcceptance.state).toBe("CONFIRMED_AVAILABLE")

    const expiredAcceptance = deriveAcceptanceAvailability(
      {
        caseCategory: "TRAUMA",
        status: "ACCEPTING",
        reasonCode: null,
        lastUpdatedAt: new Date(baseTime.getTime() - 120 * 60 * 1000).toISOString(),
        expiresAt: new Date(baseTime.getTime() - 10 * 60 * 1000).toISOString(), // expired 10 mins ago
      },
      baseTime
    )
    expect(expiredAcceptance.state).toBe("UNKNOWN")
    expect(expiredAcceptance.isExpired).toBe(true)

    const diversion = deriveAcceptanceAvailability(
      {
        caseCategory: "TRAUMA",
        status: "NOT_ACCEPTING",
        reasonCode: "ED_DIVERSION",
        lastUpdatedAt: new Date(baseTime.getTime() - 10 * 60 * 1000).toISOString(),
        expiresAt: new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString(),
      },
      baseTime
    )
    expect(diversion.state).toBe("CONFIRMED_UNAVAILABLE")
  })
})

describe("Smart Routing Domain - Spec Scenario (Trauma Emergency)", () => {
  const now = new Date("2026-10-26T12:00:00Z")

  const traumaRequirement: CareRequirement = {
    caseCategory: "TRAUMA",
    caseLabel: "Trauma Emergency",
    urgency: "EMERGENCY",
    requiredServices: ["EMERGENCY_CARE", "TRAUMA_CARE", "GENERAL_SURGERY"],
    mandatoryResources: ["ED_OPERATIONAL", "TRAUMA_TEAM"],
    requiresHospitalEmergency: true,
    profileVersion: 1,
    isClinicallyReviewed: true,
  }

  // Hospital A: 8 min, trauma capability, but trauma team UNAVAILABLE
  const hospitalA: FacilitySnapshot = {
    id: "hosp-a",
    name: "Hospital A",
    tier: "TERTIARY",
    address: "Central St.",
    municipality: "Daraga",
    province: "Albay",
    phone: "123",
    location: { lat: 13.15, lng: 123.7 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: now.toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "ER", capabilityLevel: "ADVANCED", isActive: true, lastVerifiedAt: now.toISOString() },
      { code: "TRAUMA_CARE", label: "Trauma", capabilityLevel: "ADVANCED", isActive: true, lastVerifiedAt: now.toISOString() },
      { code: "GENERAL_SURGERY", label: "Surgery", capabilityLevel: "ADVANCED", isActive: true, lastVerifiedAt: now.toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "ED Open", status: "AVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
      { type: "TRAUMA_TEAM", label: "Trauma Team", status: "UNAVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() }, // UNAVAILABLE
    ],
    acceptance: [
      { caseCategory: "TRAUMA", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 3600000).toISOString() },
    ],
  }

  // Hospital B: 14 min, trauma capability, confirmed accepting
  const hospitalB: FacilitySnapshot = {
    id: "hosp-b",
    name: "Hospital B",
    tier: "SECONDARY",
    address: "Rizal Ave",
    municipality: "Legazpi",
    province: "Albay",
    phone: "456",
    location: { lat: 13.14, lng: 123.74 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: now.toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "ER", capabilityLevel: "STANDARD", isActive: true, lastVerifiedAt: now.toISOString() },
      { code: "TRAUMA_CARE", label: "Trauma", capabilityLevel: "STANDARD", isActive: true, lastVerifiedAt: now.toISOString() },
      { code: "GENERAL_SURGERY", label: "Surgery", capabilityLevel: "STANDARD", isActive: true, lastVerifiedAt: now.toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "ED Open", status: "AVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
      { type: "TRAUMA_TEAM", label: "Trauma Team", status: "AVAILABLE", quantity: null, freshnessGroup: "CRITICAL_CAPACITY", updatedAt: now.toISOString() },
    ],
    acceptance: [
      { caseCategory: "TRAUMA", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 3600000).toISOString() },
    ],
  }

  // Hospital C: 20 min, trauma capability, confirmed accepting
  const hospitalC: FacilitySnapshot = {
    ...hospitalB,
    id: "hosp-c",
    name: "Hospital C",
    location: { lat: 13.22, lng: 123.52 },
  }

  // RHU D: 4 min, primary care only, open
  const rhuD: FacilitySnapshot = {
    id: "rhu-d",
    name: "RHU D",
    tier: "RHU",
    address: "Brgy. Health Center",
    municipality: "Daraga",
    province: "Albay",
    phone: "789",
    location: { lat: 13.16, lng: 123.69 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: now.toISOString(),
    isSampleData: false,
    services: [
      { code: "PRIMARY_CARE", label: "Primary Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: now.toISOString() },
    ],
    resources: [],
    acceptance: [],
  }

  it("evaluates eligibility correctly: excludes Hospital A and RHU D, confirms Hospital B and C", () => {
    const evalA = evaluateFacility(hospitalA, traumaRequirement, now)
    expect(evalA.verdict).toBe("EXCLUDED")
    expect(evalA.primaryIssue?.code).toBe("RESOURCE_UNAVAILABLE")

    const evalB = evaluateFacility(hospitalB, traumaRequirement, now)
    expect(evalB.verdict).toBe("CONFIRMED")
    expect(evalB.evidence.length).toBeGreaterThan(0)

    const evalC = evaluateFacility(hospitalC, traumaRequirement, now)
    expect(evalC.verdict).toBe("CONFIRMED")

    const evalD = evaluateFacility(rhuD, traumaRequirement, now)
    expect(evalD.verdict).toBe("EXCLUDED")
    // Blocked either by tier or by missing service
    expect(["TIER_INSUFFICIENT_FOR_EMERGENCY", "SERVICE_MISSING"]).toContain(evalD.primaryIssue?.code)
  })

  it("ranks facilities: recommends Hospital B, suggests Hospital C as alternative, notes nearer excluded", () => {
    const rankedCandidates: RankedFacility[] = [
      {
        ...evaluateFacility(rhuD, traumaRequirement, now),
        travel: { durationSeconds: 4 * 60, distanceMeters: 2500, source: "ROUTES_API" },
        straightLineMeters: 2000,
        exceedsUrgencyTravelLimit: false,
      },
      {
        ...evaluateFacility(hospitalA, traumaRequirement, now),
        travel: { durationSeconds: 8 * 60, distanceMeters: 6000, source: "ROUTES_API" },
        straightLineMeters: 5000,
        exceedsUrgencyTravelLimit: false,
      },
      {
        ...evaluateFacility(hospitalB, traumaRequirement, now),
        travel: { durationSeconds: 14 * 60, distanceMeters: 11000, source: "ROUTES_API" },
        straightLineMeters: 9000,
        exceedsUrgencyTravelLimit: false,
      },
      {
        ...evaluateFacility(hospitalC, traumaRequirement, now),
        travel: { durationSeconds: 20 * 60, distanceMeters: 17000, source: "ROUTES_API" },
        straightLineMeters: 14000,
        exceedsUrgencyTravelLimit: false,
      },
    ]

    const result = rankFacilities(rankedCandidates)

    expect(result.outcome).toBe("RECOMMENDED")
    expect(result.recommended?.facility.id).toBe("hosp-b")
    expect(result.alternatives).toHaveLength(1)
    expect(result.alternatives[0].facility.id).toBe("hosp-c")

    // Nearest excluded: RHU D (4 min) and Hospital A (8 min) are both nearer than Hospital B (14 min)
    expect(result.nearerExcluded).toHaveLength(2)
    const nearerIds = result.nearerExcluded.map((n) => n.facility.id)
    expect(nearerIds).toContain("rhu-d")
    expect(nearerIds).toContain("hosp-a")
  })

  it("does not recommend unverified facilities if none confirmed", () => {
    // Modify Hospital B and C to have stale availability
    const staleSnapshot: FacilitySnapshot = {
      ...hospitalB,
      resources: [
        { ...hospitalB.resources[0], updatedAt: new Date(now.getTime() - 48 * 3600 * 1000).toISOString() }, // 2 days old
      ],
    }

    const unverifiedRanked: RankedFacility[] = [
      {
        ...evaluateFacility(staleSnapshot, traumaRequirement, now),
        travel: { durationSeconds: 14 * 60, distanceMeters: 11000, source: "ROUTES_API" },
        straightLineMeters: 9000,
        exceedsUrgencyTravelLimit: false,
      },
    ]

    const result = rankFacilities(unverifiedRanked)
    expect(result.outcome).toBe("UNVERIFIED_ONLY")
    expect(result.recommended).toBeNull()
    expect(result.unverified).toHaveLength(1)
  })
})
