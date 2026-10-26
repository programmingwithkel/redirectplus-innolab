import "server-only"
import type { ReferralStatus, UrgencyLevel } from "@/lib/constants/referral-status"
import { createClient } from "@/lib/supabase/server"
import type { IncomingReferralReader, IncomingReferralWriter } from "../application/ports"
import { ReferralDomainError } from "../domain/errors"
import type {
  EditableField,
  IncomingReferral,
  IncomingReferralQuery,
  Paginated,
  ReferralDetailsPatch,
} from "../domain/types"

export type SupabaseClientFactory = typeof createClient

/** PostgREST error when the requested range starts past the last row. */
const RANGE_NOT_SATISFIABLE = "PGRST103"

const INCOMING_REFERRAL_COLUMNS = `
  id, patient_name, patient_age, patient_sex, patient_address,
  chief_complaint, reason, required_service, required_specialty,
  urgency, clinical_notes, status, receiving_facility_id,
  receiver_archived_at, created_at, updated_at,
  referring_facility:facilities!referrals_referring_facility_id_fkey(id, name, facility_type)
`

/** Domain field → database column. The only place column names for edits are known. */
const PATCH_COLUMNS: Record<EditableField, string> = {
  patientAge: "patient_age",
  patientSex: "patient_sex",
  patientAddress: "patient_address",
  requiredService: "required_service",
  requiredSpecialty: "required_specialty",
  urgency: "urgency",
  clinicalNotes: "clinical_notes",
}

interface IncomingReferralRow {
  id: string
  patient_name: string
  patient_age: number | null
  patient_sex: string | null
  patient_address: string | null
  chief_complaint: string
  reason: string | null
  required_service: string | null
  required_specialty: string | null
  urgency: UrgencyLevel
  clinical_notes: string | null
  status: ReferralStatus
  receiving_facility_id: string
  receiver_archived_at: string | null
  created_at: string
  updated_at: string
  referring_facility: { id: string; name: string; facility_type: string } | null
}

/** Supabase adapter implementing the incoming-referral read and write ports. */
export class SupabaseIncomingReferralRepository
  implements IncomingReferralReader, IncomingReferralWriter
{
  constructor(private readonly clientFactory: SupabaseClientFactory = createClient) {}

  async list(query: IncomingReferralQuery): Promise<Paginated<IncomingReferral>> {
    const supabase = await this.clientFactory()
    const from = (query.page - 1) * query.pageSize
    const to = from + query.pageSize - 1

    let builder = supabase
      .from("referrals")
      .select(INCOMING_REFERRAL_COLUMNS, { count: "exact" })
      .eq("receiving_facility_id", query.facilityId)

    if (query.view === "active") builder = builder.is("receiver_archived_at", null)
    if (query.view === "archived") builder = builder.not("receiver_archived_at", "is", null)
    if (query.status) builder = builder.eq("status", query.status)
    if (query.urgency) builder = builder.eq("urgency", query.urgency)

    const term = sanitizeSearchTerm(query.search)
    if (term) {
      builder = builder.or(
        `patient_name.ilike.%${term}%,chief_complaint.ilike.%${term}%,required_service.ilike.%${term}%`
      )
    }

    const { data, error, count } = await builder
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error && error.code !== RANGE_NOT_SATISFIABLE) {
      throw persistenceError("load incoming referrals", error)
    }

    const total = count ?? 0
    return {
      items: ((data ?? []) as unknown as IncomingReferralRow[]).map(toDomain),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  }

  async findForReceiver(referralId: string, facilityId: string): Promise<IncomingReferral | null> {
    const supabase = await this.clientFactory()
    const { data, error } = await supabase
      .from("referrals")
      .select(INCOMING_REFERRAL_COLUMNS)
      .eq("id", referralId)
      .eq("receiving_facility_id", facilityId)
      .maybeSingle()

    if (error) throw persistenceError("load referral", error)
    return data ? toDomain(data as unknown as IncomingReferralRow) : null
  }

  async updateDetails(referralId: string, patch: ReferralDetailsPatch): Promise<void> {
    const supabase = await this.clientFactory()
    const { error } = await supabase
      .from("referrals")
      .update(toPatchColumns(patch))
      .eq("id", referralId)

    if (error) throw persistenceError("update referral details", error)
  }

  async updateStatus(
    referralId: string,
    expected: ReferralStatus,
    next: ReferralStatus
  ): Promise<boolean> {
    const supabase = await this.clientFactory()
    const { data, error } = await supabase
      .from("referrals")
      .update({ status: next })
      .eq("id", referralId)
      .eq("status", expected) // compare-and-set guards against concurrent transitions
      .select("id")

    if (error) throw persistenceError("update referral status", error)
    return (data?.length ?? 0) > 0
  }

  async setArchived(
    referralId: string,
    archive: { at: Date; by: string } | null
  ): Promise<void> {
    const supabase = await this.clientFactory()
    const { error } = await supabase
      .from("referrals")
      .update({
        receiver_archived_at: archive ? archive.at.toISOString() : null,
        receiver_archived_by: archive ? archive.by : null,
      })
      .eq("id", referralId)

    if (error) throw persistenceError("update archive state", error)
  }
}

function toDomain(row: IncomingReferralRow): IncomingReferral {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientAge: row.patient_age,
    patientSex: row.patient_sex,
    patientAddress: row.patient_address,
    chiefComplaint: row.chief_complaint,
    reason: row.reason,
    requiredService: row.required_service,
    requiredSpecialty: row.required_specialty,
    urgency: row.urgency,
    clinicalNotes: row.clinical_notes,
    status: row.status,
    referringFacility: {
      id: row.referring_facility?.id ?? "",
      name: row.referring_facility?.name ?? "Unknown facility",
      facilityType: row.referring_facility?.facility_type ?? "",
    },
    receivingFacilityId: row.receiving_facility_id,
    archivedAt: row.receiver_archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPatchColumns(patch: ReferralDetailsPatch): Record<string, unknown> {
  return Object.fromEntries(
    (Object.keys(patch) as EditableField[])
      .filter((field) => patch[field] !== undefined)
      .map((field) => [PATCH_COLUMNS[field], patch[field]])
  )
}

/**
 * Removes characters that are meaningful in PostgREST `or()` filters or as
 * LIKE wildcards, so user input can't change the shape of the query.
 */
function sanitizeSearchTerm(search: string | undefined): string {
  return (search ?? "").replace(/[%_,.()*\\:"']/g, " ").replace(/\s+/g, " ").trim()
}

function persistenceError(action: string, cause: { message: string; code?: string }) {
  console.error(`[incoming-referrals] Failed to ${action}:`, cause)
  return new ReferralDomainError("PERSISTENCE", `Could not ${action}. Please try again.`)
}
