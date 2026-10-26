import type {
  ReferralEventType,
  ReferralStatus,
  UrgencyLevel,
} from "@/lib/constants/referral-status"

/** The authenticated staff member acting on behalf of a receiving facility. */
export interface ReceiverActor {
  userId: string
  facilityId: string
}

export interface FacilitySummary {
  id: string
  name: string
  facilityType: string
}

/** An incoming referral as seen by the receiving facility. */
export interface IncomingReferral {
  id: string
  patientName: string
  patientAge: number | null
  patientSex: string | null
  patientAddress: string | null
  chiefComplaint: string
  reason: string | null
  requiredService: string | null
  requiredSpecialty: string | null
  urgency: UrgencyLevel
  clinicalNotes: string | null
  status: ReferralStatus
  referringFacility: FacilitySummary
  receivingFacilityId: string
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Which slice of the receiver's inbox to show. */
export type InboxView = "active" | "archived" | "all"

export interface IncomingReferralQuery {
  facilityId: string
  search?: string
  status?: ReferralStatus
  urgency?: UrgencyLevel
  view: InboxView
  page: number
  pageSize: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Fields the receiving facility may correct after triage.
 * `undefined` = leave unchanged, `null` = clear the value.
 */
export interface ReferralDetailsPatch {
  patientAge?: number | null
  patientSex?: string | null
  patientAddress?: string | null
  requiredService?: string | null
  requiredSpecialty?: string | null
  urgency?: UrgencyLevel
  clinicalNotes?: string | null
}

export type EditableField = keyof ReferralDetailsPatch

export interface FieldChange {
  field: EditableField
  from: unknown
  to: unknown
}

/** What the receiver may do with a referral right now. Drives the UI. */
export interface ReceiverCapabilities {
  transitions: ReferralStatus[]
  canEditDetails: boolean
  canArchive: boolean
  canUnarchive: boolean
}

/** An entry for the immutable referral audit trail. */
export interface ReferralEventRecord {
  referralId: string
  eventType: ReferralEventType
  previousStatus: ReferralStatus | null
  newStatus: ReferralStatus | null
  notes: string | null
  actorId: string
}
