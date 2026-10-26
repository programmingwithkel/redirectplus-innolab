// ============================================
// Shared Healthcare Services — Type Definitions
// Focused interfaces for each UI section (ISP)
// ============================================

import type {
  ResourceStatus,
  CapabilityLevel,
  FacilityType,
  OperatingStatus,
} from "./database"

// ─── Doctor / Specialist Entry ───────────────────────────────────────────────

export interface DoctorSpecialist {
  id: string
  facilityId: string
  facilityName: string
  facilityType: FacilityType
  specialistLabel: string
  resourceTypeCode: string
  status: ResourceStatus
  updatedAt: string
}

// ─── Bed / Room Entry ────────────────────────────────────────────────────────

export interface BedRoom {
  id: string
  facilityId: string
  facilityName: string
  facilityType: FacilityType
  bedLabel: string
  resourceTypeCode: string
  status: ResourceStatus
  quantity: number | null
  updatedAt: string
}

// ─── Facility Service Entry ──────────────────────────────────────────────────

export interface FacilityServiceEntry {
  id: string
  facilityId: string
  facilityName: string
  facilityType: FacilityType
  serviceCode: string
  serviceLabel: string
  serviceDescription: string | null
  capabilityLevel: CapabilityLevel
  isActive: boolean
  lastVerifiedAt: string | null
}

// ─── Aggregated Stats ────────────────────────────────────────────────────────

export interface HealthcareServicesStats {
  totalFacilities: number
  totalDoctorsOnCall: number
  totalAvailableBeds: number
  totalServices: number
  doctorsAvailable: number
  doctorsUnavailable: number
  bedsAvailable: number
  bedsLimited: number
  bedsUnavailable: number
}

// ─── Full data bundle returned by the query layer ────────────────────────────

export interface HealthcareServicesData {
  stats: HealthcareServicesStats
  doctors: DoctorSpecialist[]
  beds: BedRoom[]
  services: FacilityServiceEntry[]
}

// ─── Filter state for the client-side view ───────────────────────────────────

export interface HealthcareServicesFilterState {
  searchQuery: string
  facilityTypeFilter: string // "ALL" | FacilityType
  statusFilter: string // "ALL" | ResourceStatus
}
