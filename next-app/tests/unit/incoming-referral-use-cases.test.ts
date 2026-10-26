import { describe, expect, it, vi } from "vitest"
import type {
  Clock,
  IncomingReferralReader,
  IncomingReferralWriter,
  ReferralEventLog,
} from "@/lib/referrals/application/ports"
import { ListIncomingReferralsUseCase } from "@/lib/referrals/application/list-incoming-referrals"
import { GetIncomingReferralUseCase } from "@/lib/referrals/application/get-incoming-referral"
import { UpdateIncomingReferralDetailsUseCase } from "@/lib/referrals/application/update-incoming-referral-details"
import { TransitionIncomingReferralUseCase } from "@/lib/referrals/application/transition-incoming-referral"
import { SetIncomingReferralArchivedUseCase } from "@/lib/referrals/application/set-incoming-referral-archived"
import type {
  IncomingReferral,
  IncomingReferralQuery,
  Paginated,
  ReceiverActor,
  ReferralDetailsPatch,
  ReferralEventRecord,
} from "@/lib/referrals/domain/types"
import type { ReferralStatus } from "@/lib/constants/referral-status"

class InMemoryReferralStore implements IncomingReferralReader, IncomingReferralWriter {
  public items: IncomingReferral[] = []

  async list(query: IncomingReferralQuery): Promise<Paginated<IncomingReferral>> {
    let filtered = this.items.filter(
      (item) => item.receivingFacilityId === query.facilityId
    )
    if (query.view === "active") {
      filtered = filtered.filter((i) => i.archivedAt === null)
    } else if (query.view === "archived") {
      filtered = filtered.filter((i) => i.archivedAt !== null)
    }
    if (query.status) {
      filtered = filtered.filter((i) => i.status === query.status)
    }
    return {
      items: filtered,
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: 1,
    }
  }

  async findForReceiver(
    referralId: string,
    facilityId: string
  ): Promise<IncomingReferral | null> {
    return (
      this.items.find(
        (i) => i.id === referralId && i.receivingFacilityId === facilityId
      ) ?? null
    )
  }

  async updateDetails(
    referralId: string,
    patch: ReferralDetailsPatch
  ): Promise<void> {
    const item = this.items.find((i) => i.id === referralId)
    if (item) {
      Object.assign(item, patch)
      item.updatedAt = new Date().toISOString()
    }
  }

  async updateStatus(
    referralId: string,
    expected: ReferralStatus,
    next: ReferralStatus
  ): Promise<boolean> {
    const item = this.items.find((i) => i.id === referralId)
    if (!item || item.status !== expected) {
      return false
    }
    item.status = next
    item.updatedAt = new Date().toISOString()
    return true
  }

  async setArchived(
    referralId: string,
    archive: { at: Date; by: string } | null
  ): Promise<void> {
    const item = this.items.find((i) => i.id === referralId)
    if (item) {
      item.archivedAt = archive ? archive.at.toISOString() : null
    }
  }
}

class InMemoryEventLog implements ReferralEventLog {
  public recorded: ReferralEventRecord[] = []
  async record(event: ReferralEventRecord): Promise<void> {
    this.recorded.push(event)
  }
}

describe("Incoming Referral Use Cases (Application Layer with Test Doubles)", () => {
  const actor: ReceiverActor = {
    userId: "user-receiver-1",
    facilityId: "fac-receiver",
  }

  function makeSample(id: string, status: ReferralStatus = "PENDING"): IncomingReferral {
    return {
      id,
      patientName: "Patient " + id,
      patientAge: 30,
      patientSex: "Female",
      patientAddress: "Naga City",
      chiefComplaint: "High fever",
      reason: null,
      requiredService: "General Medicine",
      requiredSpecialty: null,
      urgency: "ROUTINE",
      clinicalNotes: "Initial note",
      status,
      referringFacility: {
        id: "fac-sender",
        name: "Sender Clinic",
        facilityType: "RHU",
      },
      receivingFacilityId: "fac-receiver",
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  it("ListUseCase lists referrals scoped to actor's facility", async () => {
    const store = new InMemoryReferralStore()
    store.items = [
      makeSample("ref-1"),
      makeSample("ref-2"),
      {
        ...makeSample("ref-3"),
        receivingFacilityId: "other-fac", // foreign facility
      },
    ]

    const useCase = new ListIncomingReferralsUseCase(store)
    const result = await useCase.execute(actor, {
      view: "active",
      page: 1,
      pageSize: 10,
    })

    expect(result.items).toHaveLength(2)
    expect(result.items.map((r) => r.id)).toEqual(["ref-1", "ref-2"])
  })

  it("GetUseCase retrieves referral with computed receiver capabilities", async () => {
    const store = new InMemoryReferralStore()
    store.items = [makeSample("ref-1", "PENDING")]

    const useCase = new GetIncomingReferralUseCase(store)
    const view = await useCase.execute(actor, "ref-1")

    expect(view.referral.id).toBe("ref-1")
    expect(view.capabilities.canEditDetails).toBe(true)
    expect(view.capabilities.transitions).toContain("ACKNOWLEDGED")
  })

  it("UpdateDetailsUseCase applies patch and records DETAILS_UPDATED event", async () => {
    const store = new InMemoryReferralStore()
    const eventLog = new InMemoryEventLog()
    store.items = [makeSample("ref-1", "PENDING")]

    const useCase = new UpdateIncomingReferralDetailsUseCase(store, store, eventLog)
    const changes = await useCase.execute(actor, {
      referralId: "ref-1",
      patch: {
        clinicalNotes: "Updated clinical observation",
        urgency: "URGENT",
      },
      note: "Nurse triage change",
    })

    expect(changes).toHaveLength(2)
    expect(store.items[0].clinicalNotes).toBe("Updated clinical observation")
    expect(store.items[0].urgency).toBe("URGENT")

    expect(eventLog.recorded).toHaveLength(1)
    expect(eventLog.recorded[0].eventType).toBe("DETAILS_UPDATED")
    expect(eventLog.recorded[0].notes).toContain("Nurse triage change")
  })

  it("TransitionUseCase executes valid status change with optimistic concurrency check", async () => {
    const store = new InMemoryReferralStore()
    const eventLog = new InMemoryEventLog()
    store.items = [makeSample("ref-1", "PENDING")]

    const useCase = new TransitionIncomingReferralUseCase(store, store, eventLog)
    await useCase.execute(actor, {
      referralId: "ref-1",
      nextStatus: "ACKNOWLEDGED",
      note: "Acknowledged by Dr. Santos",
    })

    expect(store.items[0].status).toBe("ACKNOWLEDGED")
    expect(eventLog.recorded).toHaveLength(1)
    expect(eventLog.recorded[0].eventType).toBe("ACKNOWLEDGED")
    expect(eventLog.recorded[0].newStatus).toBe("ACKNOWLEDGED")
  })

  it("TransitionUseCase rejects when concurrent update changed status", async () => {
    const store = new InMemoryReferralStore()
    const eventLog = new InMemoryEventLog()
    store.items = [makeSample("ref-1", "PENDING")]

    // Mock updateStatus returning false (conflict)
    vi.spyOn(store, "updateStatus").mockResolvedValueOnce(false)

    const useCase = new TransitionIncomingReferralUseCase(store, store, eventLog)
    await expect(
      useCase.execute(actor, {
        referralId: "ref-1",
        nextStatus: "ACKNOWLEDGED",
      })
    ).rejects.toThrow("This referral was updated by someone else")
  })

  it("SetArchivedUseCase archives completed referral and records ARCHIVED event", async () => {
    const store = new InMemoryReferralStore()
    const eventLog = new InMemoryEventLog()
    const fixedDate = new Date("2026-10-27T08:00:00Z")
    const clock: Clock = { now: () => fixedDate }

    store.items = [makeSample("ref-1", "COMPLETED")]

    const useCase = new SetIncomingReferralArchivedUseCase(store, store, eventLog, clock)
    await useCase.execute(actor, {
      referralId: "ref-1",
      archived: true,
    })

    expect(store.items[0].archivedAt).toBe(fixedDate.toISOString())
    expect(eventLog.recorded).toHaveLength(1)
    expect(eventLog.recorded[0].eventType).toBe("ARCHIVED")
  })
})
