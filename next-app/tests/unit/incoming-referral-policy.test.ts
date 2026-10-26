import { describe, expect, it } from "vitest"
import { ReferralDomainError } from "@/lib/referrals/domain/errors"
import {
  assertCanArchive,
  assertCanEditDetails,
  assertCanTransition,
  assertCanUnarchive,
  assertIsReceiver,
  diffDetails,
  getReceiverCapabilities,
  getReceiverTransitions,
  pickChangedFields,
  transitionEventType,
} from "@/lib/referrals/domain/incoming-referral-policy"
import type { IncomingReferral, ReceiverActor } from "@/lib/referrals/domain/types"

function createSampleReferral(overrides?: Partial<IncomingReferral>): IncomingReferral {
  return {
    id: "ref-123",
    patientName: "Juan Dela Cruz",
    patientAge: 45,
    patientSex: "Male",
    patientAddress: "Legazpi City",
    chiefComplaint: "Severe abdominal pain",
    reason: "Requires ultrasound",
    requiredService: "Ultrasound",
    requiredSpecialty: "Radiology",
    urgency: "URGENT",
    clinicalNotes: "Stable vitals",
    status: "PENDING",
    referringFacility: {
      id: "fac-sender",
      name: "Sender RHU",
      facilityType: "RHU",
    },
    receivingFacilityId: "fac-receiver",
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("Incoming Referral Policy (Domain Rules)", () => {
  const actor: ReceiverActor = {
    userId: "usr-1",
    facilityId: "fac-receiver",
  }

  describe("Ownership assertion", () => {
    it("permits access when actor belongs to receiving facility", () => {
      const referral = createSampleReferral()
      expect(() => assertIsReceiver(referral, actor)).not.toThrow()
    })

    it("throws FORBIDDEN when actor does not belong to receiving facility", () => {
      const referral = createSampleReferral({ receivingFacilityId: "other-fac" })
      expect(() => assertIsReceiver(referral, actor)).toThrow(ReferralDomainError)
      try {
        assertIsReceiver(referral, actor)
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN")
      }
    })
  })

  describe("Transitions", () => {
    it("allows receiver to acknowledge a PENDING referral", () => {
      const referral = createSampleReferral({ status: "PENDING" })
      expect(getReceiverTransitions("PENDING")).toEqual(["ACKNOWLEDGED"])
      expect(() => assertCanTransition(referral, "ACKNOWLEDGED")).not.toThrow()
    })

    it("allows receiver to ACCEPT or DECLINE an ACKNOWLEDGED referral", () => {
      const transitions = getReceiverTransitions("ACKNOWLEDGED")
      expect(transitions).toContain("ACCEPTED")
      expect(transitions).toContain("DECLINED")
    })

    it("rejects illegal transitions", () => {
      const referral = createSampleReferral({ status: "PENDING" })
      expect(() => assertCanTransition(referral, "COMPLETED")).toThrow(ReferralDomainError)
      try {
        assertCanTransition(referral, "COMPLETED")
      } catch (err: any) {
        expect(err.code).toBe("INVALID_STATE")
      }
    })

    it("maps transitions to correct event types", () => {
      expect(transitionEventType("ACKNOWLEDGED")).toBe("ACKNOWLEDGED")
      expect(transitionEventType("ACCEPTED")).toBe("ACCEPTED")
      expect(transitionEventType("DECLINED")).toBe("DECLINED")
      expect(transitionEventType("IN_PROGRESS")).toBe("IN_PROGRESS")
      expect(transitionEventType("COMPLETED")).toBe("COMPLETED")
    })
  })

  describe("Archiving & Soft Delete rules", () => {
    it("forbids archiving an active referral", () => {
      const referral = createSampleReferral({ status: "PENDING" })
      expect(() => assertCanArchive(referral)).toThrow("Only completed, declined, or cancelled referrals can be archived")
    })

    it("allows archiving a COMPLETED or DECLINED referral", () => {
      const completed = createSampleReferral({ status: "COMPLETED" })
      expect(() => assertCanArchive(completed)).not.toThrow()

      const declined = createSampleReferral({ status: "DECLINED" })
      expect(() => assertCanArchive(declined)).not.toThrow()
    })

    it("forbids archiving an already-archived referral", () => {
      const referral = createSampleReferral({
        status: "COMPLETED",
        archivedAt: new Date().toISOString(),
      })
      expect(() => assertCanArchive(referral)).toThrow("Referral is already archived")
    })

    it("allows unarchiving only if archived", () => {
      const active = createSampleReferral()
      expect(() => assertCanUnarchive(active)).toThrow("Referral is not archived")

      const archived = createSampleReferral({
        status: "COMPLETED",
        archivedAt: new Date().toISOString(),
      })
      expect(() => assertCanUnarchive(archived)).not.toThrow()
    })
  })

  describe("Details Diffing & Capabilities", () => {
    it("computes diff of changed fields only", () => {
      const referral = createSampleReferral({ patientAge: 45, urgency: "URGENT" })
      const diff = diffDetails(referral, {
        patientAge: 46,
        urgency: "URGENT", // unchanged
        clinicalNotes: "Patient arrived via ambulance",
      })

      expect(diff).toHaveLength(2)
      expect(diff.find((d) => d.field === "patientAge")).toEqual({
        field: "patientAge",
        from: 45,
        to: 46,
      })
      expect(diff.find((d) => d.field === "clinicalNotes")).toEqual({
        field: "clinicalNotes",
        from: "Stable vitals",
        to: "Patient arrived via ambulance",
      })

      const patch = pickChangedFields(diff)
      expect(patch).toEqual({
        patientAge: 46,
        clinicalNotes: "Patient arrived via ambulance",
      })
    })

    it("prevents editing details on terminal or archived referrals", () => {
      const completed = createSampleReferral({ status: "COMPLETED" })
      expect(() => assertCanEditDetails(completed)).toThrow("Only active, non-archived referrals can be edited")

      const archived = createSampleReferral({
        status: "PENDING",
        archivedAt: new Date().toISOString(),
      })
      expect(() => assertCanEditDetails(archived)).toThrow("Only active, non-archived referrals can be edited")
    })

    it("returns correct capabilities for active pending referral", () => {
      const referral = createSampleReferral({ status: "PENDING" })
      const caps = getReceiverCapabilities(referral)
      expect(caps.canEditDetails).toBe(true)
      expect(caps.canArchive).toBe(false)
      expect(caps.canUnarchive).toBe(false)
      expect(caps.transitions).toEqual(["ACKNOWLEDGED"])
    })
  })
})
