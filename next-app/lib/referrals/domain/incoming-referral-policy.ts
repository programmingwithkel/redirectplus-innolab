import {
  TERMINAL_STATUSES,
  VALID_STATUS_TRANSITIONS,
  type ReferralEventType,
  type ReferralStatus,
} from "@/lib/constants/referral-status"
import { ReferralDomainError } from "./errors"
import type {
  EditableField,
  FieldChange,
  IncomingReferral,
  ReceiverActor,
  ReceiverCapabilities,
  ReferralDetailsPatch,
} from "./types"

/**
 * Pure business rules for how a RECEIVING facility may act on a referral.
 * No I/O lives here, so every rule is unit-testable in isolation.
 */

/** Status changes owned by the receiver. CANCELLED belongs to the sender, REDIRECTED has its own flow. */
export const RECEIVER_OWNED_TRANSITIONS: readonly ReferralStatus[] = [
  "ACKNOWLEDGED",
  "ACCEPTED",
  "DECLINED",
  "IN_PROGRESS",
  "COMPLETED",
]

/** Audit event recorded for each receiver-owned status change. */
const TRANSITION_EVENT_TYPES: Partial<Record<ReferralStatus, ReferralEventType>> = {
  ACKNOWLEDGED: "ACKNOWLEDGED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
}

export function transitionEventType(next: ReferralStatus): ReferralEventType {
  const eventType = TRANSITION_EVENT_TYPES[next]
  if (!eventType) {
    throw new ReferralDomainError("INVALID_STATE", `${next} is not a receiver transition`)
  }
  return eventType
}

/** Maps each editable field to the IncomingReferral property it patches. */
const FIELD_TO_PROPERTY: Record<EditableField, keyof IncomingReferral> = {
  patientAge: "patientAge",
  patientSex: "patientSex",
  patientAddress: "patientAddress",
  requiredService: "requiredService",
  requiredSpecialty: "requiredSpecialty",
  urgency: "urgency",
  clinicalNotes: "clinicalNotes",
}

export const FIELD_LABELS: Record<EditableField, string> = {
  patientAge: "Age",
  patientSex: "Sex",
  patientAddress: "Address",
  requiredService: "Required service",
  requiredSpecialty: "Required specialty",
  urgency: "Urgency",
  clinicalNotes: "Clinical notes",
}

export function isTerminal(status: ReferralStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isArchived(referral: Pick<IncomingReferral, "archivedAt">): boolean {
  return referral.archivedAt !== null
}

export function assertIsReceiver(referral: IncomingReferral, actor: ReceiverActor): void {
  if (referral.receivingFacilityId !== actor.facilityId) {
    throw new ReferralDomainError(
      "FORBIDDEN",
      "Only the receiving facility can manage this referral"
    )
  }
}

export function getReceiverTransitions(status: ReferralStatus): ReferralStatus[] {
  return VALID_STATUS_TRANSITIONS[status].filter((next) =>
    RECEIVER_OWNED_TRANSITIONS.includes(next)
  )
}

export function assertCanTransition(referral: IncomingReferral, next: ReferralStatus): void {
  if (isArchived(referral)) {
    throw new ReferralDomainError("INVALID_STATE", "Restore this referral before changing its status")
  }
  if (!getReceiverTransitions(referral.status).includes(next)) {
    throw new ReferralDomainError(
      "INVALID_STATE",
      `Cannot move a referral from ${referral.status} to ${next}`
    )
  }
}

export function canEditDetails(referral: IncomingReferral): boolean {
  return !isTerminal(referral.status) && !isArchived(referral)
}

export function assertCanEditDetails(referral: IncomingReferral): void {
  if (!canEditDetails(referral)) {
    throw new ReferralDomainError(
      "INVALID_STATE",
      "Only active, non-archived referrals can be edited"
    )
  }
}

/** Only closed referrals can be archived, so an active patient is never hidden from the inbox. */
export function canArchive(referral: IncomingReferral): boolean {
  return isTerminal(referral.status) && !isArchived(referral)
}

export function assertCanArchive(referral: IncomingReferral): void {
  if (isArchived(referral)) {
    throw new ReferralDomainError("INVALID_STATE", "Referral is already archived")
  }
  if (!isTerminal(referral.status)) {
    throw new ReferralDomainError(
      "INVALID_STATE",
      "Only completed, declined, or cancelled referrals can be archived"
    )
  }
}

export function assertCanUnarchive(referral: IncomingReferral): void {
  if (!isArchived(referral)) {
    throw new ReferralDomainError("INVALID_STATE", "Referral is not archived")
  }
}

export function getReceiverCapabilities(referral: IncomingReferral): ReceiverCapabilities {
  return {
    transitions: isArchived(referral) ? [] : getReceiverTransitions(referral.status),
    canEditDetails: canEditDetails(referral),
    canArchive: canArchive(referral),
    canUnarchive: isArchived(referral),
  }
}

/** Returns only the fields whose value actually changes. An empty array means no-op. */
export function diffDetails(
  referral: IncomingReferral,
  patch: ReferralDetailsPatch
): FieldChange[] {
  return (Object.keys(patch) as EditableField[])
    .filter((field) => patch[field] !== undefined)
    .map((field) => ({
      field,
      from: referral[FIELD_TO_PROPERTY[field]] ?? null,
      to: patch[field] ?? null,
    }))
    .filter((change) => change.from !== change.to)
}

/** Reduces a patch to the fields that actually change. */
export function pickChangedFields(changes: FieldChange[]): ReferralDetailsPatch {
  return Object.fromEntries(changes.map((c) => [c.field, c.to])) as ReferralDetailsPatch
}

export function describeChanges(changes: FieldChange[]): string {
  return changes
    .map(({ field, from, to }) => {
      const label = FIELD_LABELS[field]
      // Long free text is summarized so the audit note stays readable
      if (field === "clinicalNotes") return `${label} updated`
      return `${label}: ${formatValue(from)} → ${formatValue(to)}`
    })
    .join("; ")
}

function formatValue(value: unknown): string {
  return value === null || value === "" ? "—" : String(value)
}
