export interface FacilityResource {
  id: string
  resource_name: string
  resource_category?: string | null
  resource_type?: string | null
  status: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN" | string
  quantity?: number | null
  description?: string | null
}

export interface DirectoryFacility {
  id: string
  name: string
  facility_type: "TERTIARY" | "SECONDARY" | "RHU" | "BHS" | string
  address?: string | null
  city?: string | null
  province?: string | null
  latitude?: number | null
  longitude?: number | null
  contact_number?: string | null
  email?: string | null
  is_verified?: boolean
  operating_status?: "OPERATIONAL" | "LIMITED_OPERATIONS" | "CLOSED" | "UNKNOWN" | string | null
  is_sample_data?: boolean
  resources?: FacilityResource[]
}

export type FacilityViewMode = "grid" | "list"
export type FacilitySortOption = "name" | "tier" | "municipality"

export interface FacilityFilterState {
  query: string
  tier: string // "ALL" | "TERTIARY" | "SECONDARY" | "RHU" | "BHS"
  status: string // "ALL" | "OPERATIONAL" | "LIMITED" | "CLOSED"
  serviceTag: string // "ALL" | "EMERGENCY" | "SURGERY" | "ICU" | "MATERNAL" | "DIAGNOSTICS"
  viewMode: FacilityViewMode
  sortBy: FacilitySortOption
}
