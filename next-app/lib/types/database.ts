// ============================================
// CareRoute Bicol — Database TypeScript Types
// Matches the Supabase schema exactly
// ============================================

// ===========================================
// Enums (match PostgreSQL enums)
// ===========================================

export type FacilityType = "BHS" | "RHU" | "SECONDARY" | "TERTIARY"
export type UserRole = "super_admin" | "operational"
export type ReferralStatus =
  | "PENDING"
  | "ACKNOWLEDGED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "REDIRECTED"
  | "CANCELLED"
export type ReferralEventType =
  | "CREATED"
  | "ACKNOWLEDGED"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "REDIRECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "NOTE_ADDED"
  | "DETAILS_UPDATED"
  | "ARCHIVED"
  | "UNARCHIVED"
export type UrgencyLevel = "ROUTINE" | "URGENT" | "EMERGENCY"
export type ResourceStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN"
export type OperatingStatus = "OPERATIONAL" | "LIMITED_OPERATIONS" | "CLOSED" | "UNKNOWN"
export type CapabilityLevel = "BASIC" | "STANDARD" | "ADVANCED"
export type AcceptanceStatus =
  | "ACCEPTING"
  | "ACCEPTING_WITH_CONDITIONS"
  | "NOT_ACCEPTING"
  | "UNKNOWN"
export type FreshnessGroup = "CRITICAL_CAPACITY" | "BEDS" | "EQUIPMENT_STAFF"
export type TravelSource = "ROUTES_API" | "APPROX_FALLBACK"
export type RecommendationOutcome = "RECOMMENDED" | "UNVERIFIED_ONLY" | "NONE"
export type AcceptanceReasonCode =
  | "NO_BEDS"
  | "NO_SPECIALIST"
  | "EQUIPMENT_UNAVAILABLE"
  | "ED_DIVERSION"
  | "STAFF_SHORTAGE"
  | "OTHER"

// ===========================================
// Table Row Types
// ===========================================

export interface Facility {
  id: string
  name: string
  facility_type: FacilityType
  address: string | null
  city: string | null
  province: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  contact_number: string | null
  email: string | null
  is_verified: boolean
  is_active: boolean
  operating_status: OperatingStatus
  operating_status_updated_at: string | null
  verified_at: string | null
  is_sample_data: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  facility_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  // Patient info
  patient_name: string
  patient_age: number | null
  patient_sex: string | null
  patient_address: string | null
  patient_latitude: number | null
  patient_longitude: number | null
  // Referral details
  chief_complaint: string
  reason: string | null
  required_service: string | null
  required_specialty: string | null
  urgency: UrgencyLevel
  clinical_notes: string | null
  // Facility references
  referring_facility_id: string
  receiving_facility_id: string
  // Status
  status: ReferralStatus
  // Recommendation metadata
  recommendation_score: number | null
  recommendation_reason: string | null
  override_reason: string | null
  recommendation_run_id: string | null
  // Receiver-side soft archive (inbox only)
  receiver_archived_at: string | null
  receiver_archived_by: string | null
  // Actor
  created_by: string
  // Timestamps
  created_at: string
  updated_at: string
}

export interface ReferralEvent {
  id: string
  referral_id: string
  event_type: ReferralEventType
  previous_status: ReferralStatus | null
  new_status: ReferralStatus | null
  previous_receiving_facility_id: string | null
  new_receiving_facility_id: string | null
  notes: string | null
  actor_id: string | null
  created_at: string
}

export interface FacilityResource {
  id: string
  facility_id: string
  resource_name: string
  resource_category: string | null
  /** Controlled code. NULL = legacy free-text row, display-only, never used for matching. */
  resource_type: string | null
  status: ResourceStatus
  quantity: number | null
  description: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ServiceCatalogEntry {
  code: string
  label: string
  description: string | null
}

export interface ResourceTypeEntry {
  code: string
  label: string
  freshness_group: FreshnessGroup
  is_countable: boolean
  description: string | null
}

export interface CareRequirementProfileRow {
  case_category: string
  label: string
  description: string | null
  required_services: string[]
  mandatory_resources: string[]
  requires_hospital_emergency: boolean
  is_emergency_category: boolean
  version: number
  is_clinically_reviewed: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  is_active: boolean
  updated_at: string
}

export interface FacilityService {
  id: string
  facility_id: string
  service_code: string
  capability_level: CapabilityLevel
  is_active: boolean
  last_verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export interface FacilityAcceptanceStatus {
  id: string
  facility_id: string
  case_category: string
  acceptance_status: AcceptanceStatus
  reason_code: AcceptanceReasonCode | null
  updated_by: string | null
  last_updated_at: string
  expires_at: string
}

export interface RecommendationRun {
  id: string
  requested_by: string
  requester_facility_id: string | null
  case_category: string
  urgency: UrgencyLevel
  origin_latitude: number
  origin_longitude: number
  requirement_snapshot: Record<string, unknown>
  candidates_snapshot: Record<string, unknown>[]
  recommended_facility_id: string | null
  outcome: RecommendationOutcome
  travel_source: TravelSource
  profile_version: number
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// ===========================================
// Joined/Extended Types (for UI)
// ===========================================

export interface ProfileWithFacility extends Profile {
  facility: Facility | null
}

export interface ReferralWithFacilities extends Referral {
  referring_facility: Facility
  receiving_facility: Facility
}

export interface ReferralWithDetails extends ReferralWithFacilities {
  events: ReferralEventWithActor[]
  created_by_profile: Profile
}

export interface ReferralEventWithActor extends ReferralEvent {
  actor: Profile | null
  previous_facility?: Facility | null
  new_facility?: Facility | null
}

export interface FacilityWithResources extends Facility {
  resources: FacilityResource[]
}

// ===========================================
// Insert Types (for creating new records)
// ===========================================

export interface ReferralInsert {
  patient_name: string
  patient_age?: number | null
  patient_sex?: string | null
  patient_address?: string | null
  patient_latitude?: number | null
  patient_longitude?: number | null
  chief_complaint: string
  reason?: string | null
  required_service?: string | null
  required_specialty?: string | null
  urgency: UrgencyLevel
  clinical_notes?: string | null
  referring_facility_id: string
  receiving_facility_id: string
  recommendation_score?: number | null
  recommendation_reason?: string | null
  override_reason?: string | null
  created_by: string
}

export interface FacilityResourceInsert {
  facility_id: string
  resource_name: string
  resource_category?: string | null
  status: ResourceStatus
  quantity?: number | null
  description?: string | null
  updated_by?: string | null
}

export interface FacilityInsert {
  name: string
  facility_type: FacilityType
  address?: string | null
  city?: string | null
  province?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  contact_number?: string | null
  email?: string | null
  is_verified?: boolean
  is_active?: boolean
}
