import "server-only"

import { createClient } from "@/lib/supabase/server"
import type {
  HealthcareServicesData,
  HealthcareServicesStats,
  DoctorSpecialist,
  BedRoom,
  FacilityServiceEntry,
} from "@/lib/types/healthcare-services"
import type { FacilityType, ResourceStatus, CapabilityLevel } from "@/lib/types/database"

// ─── Resource type codes that represent doctors/specialists ──────────────────

const SPECIALIST_RESOURCE_CODES = [
  "SURGEON_ON_CALL",
  "OBSTETRICIAN_ON_DUTY",
  "NEUROLOGIST_ON_CALL",
  "CARDIOLOGIST_ON_CALL",
  "TRAUMA_TEAM",
] as const

// ─── Resource type codes that represent beds/rooms ───────────────────────────

const BED_ROOM_RESOURCE_CODES = [
  "ICU_BED",
  "WARD_BED",
  "OB_BED",
  "NICU_BED",
  "PEDIATRIC_BED",
  "OPERATING_ROOM",
  "DELIVERY_ROOM",
] as const

// ─── Mapping helpers (single responsibility) ────────────────────────────────

function mapToDoctorSpecialist(
  row: any,
  resourceTypeMap: Map<string, string>
): DoctorSpecialist {
  return {
    id: row.id,
    facilityId: row.facility_id,
    facilityName: row.facility?.name ?? "Unknown",
    facilityType: (row.facility?.facility_type ?? "RHU") as FacilityType,
    specialistLabel: resourceTypeMap.get(row.resource_type) ?? row.resource_name,
    resourceTypeCode: row.resource_type,
    status: row.status as ResourceStatus,
    updatedAt: row.updated_at,
  }
}

function mapToBedRoom(
  row: any,
  resourceTypeMap: Map<string, string>
): BedRoom {
  return {
    id: row.id,
    facilityId: row.facility_id,
    facilityName: row.facility?.name ?? "Unknown",
    facilityType: (row.facility?.facility_type ?? "RHU") as FacilityType,
    bedLabel: resourceTypeMap.get(row.resource_type) ?? row.resource_name,
    resourceTypeCode: row.resource_type,
    status: row.status as ResourceStatus,
    quantity: row.quantity,
    updatedAt: row.updated_at,
  }
}

function mapToServiceEntry(row: any): FacilityServiceEntry {
  return {
    id: row.id,
    facilityId: row.facility_id,
    facilityName: row.facility?.name ?? "Unknown",
    facilityType: (row.facility?.facility_type ?? "RHU") as FacilityType,
    serviceCode: row.service_code,
    serviceLabel: row.service?.label ?? row.service_code,
    serviceDescription: row.service?.description ?? null,
    capabilityLevel: row.capability_level as CapabilityLevel,
    isActive: row.is_active,
    lastVerifiedAt: row.last_verified_at,
  }
}

// ─── Compute aggregate stats ─────────────────────────────────────────────────

function computeStats(
  doctors: DoctorSpecialist[],
  beds: BedRoom[],
  services: FacilityServiceEntry[]
): HealthcareServicesStats {
  const facilityIds = new Set([
    ...doctors.map((d) => d.facilityId),
    ...beds.map((b) => b.facilityId),
    ...services.map((s) => s.facilityId),
  ])

  return {
    totalFacilities: facilityIds.size,
    totalDoctorsOnCall: doctors.length,
    totalAvailableBeds: beds.reduce(
      (sum, b) => sum + (b.status === "AVAILABLE" ? (b.quantity ?? 0) : 0),
      0
    ),
    totalServices: services.filter((s) => s.isActive).length,
    doctorsAvailable: doctors.filter((d) => d.status === "AVAILABLE").length,
    doctorsUnavailable: doctors.filter((d) => d.status === "UNAVAILABLE").length,
    bedsAvailable: beds.filter((b) => b.status === "AVAILABLE").length,
    bedsLimited: beds.filter((b) => b.status === "LIMITED").length,
    bedsUnavailable: beds.filter((b) => b.status === "UNAVAILABLE").length,
  }
}

import { DUMMY_HEALTHCARE_SERVICES_DATA } from "@/lib/mock/healthcare-services-dummy-data"

// ─── Main query function (DRY: single source for both pages) ─────────────────

export async function fetchHealthcareServicesData(): Promise<HealthcareServicesData> {
  try {
    const supabase = await createClient()

    // 1. Fetch resource_types lookup for human-readable labels
    const { data: resourceTypes } = await supabase
      .from("resource_types")
      .select("code, label")

    const resourceTypeMap = new Map<string, string>(
      (resourceTypes ?? []).map((rt: any) => [rt.code, rt.label])
    )

    // 2. Fetch specialist resources across all active facilities
    const { data: specialistRows } = await supabase
      .from("facility_resources")
      .select("*, facility:facilities!inner(name, facility_type, is_active)")
      .in("resource_type", [...SPECIALIST_RESOURCE_CODES])
      .not("resource_type", "is", null)
      .order("updated_at", { ascending: false })

    // Filter to active facilities only (in-app, since Supabase nested filter is limited)
    const activeDoctorRows = (specialistRows ?? []).filter(
      (r: any) => r.facility?.is_active !== false
    )

    // 3. Fetch bed/room resources across all active facilities
    const { data: bedRows } = await supabase
      .from("facility_resources")
      .select("*, facility:facilities!inner(name, facility_type, is_active)")
      .in("resource_type", [...BED_ROOM_RESOURCE_CODES])
      .not("resource_type", "is", null)
      .order("updated_at", { ascending: false })

    const activeBedRows = (bedRows ?? []).filter(
      (r: any) => r.facility?.is_active !== false
    )

    // 4. Fetch facility services across all facilities
    const { data: serviceRows } = await supabase
      .from("facility_services")
      .select(
        "*, facility:facilities!inner(name, facility_type, is_active), service:service_catalog!inner(label, description)"
      )
      .eq("is_active", true)
      .order("service_code")

    const activeServiceRows = (serviceRows ?? []).filter(
      (r: any) => r.facility?.is_active !== false
    )

    // 5. Map to domain types
    const doctors = activeDoctorRows.map((row: any) =>
      mapToDoctorSpecialist(row, resourceTypeMap)
    )
    const beds = activeBedRows.map((row: any) =>
      mapToBedRoom(row, resourceTypeMap)
    )
    const services = activeServiceRows.map(mapToServiceEntry)

    // If no records were found in the database, return comprehensive dummy data
    if (doctors.length === 0 && beds.length === 0 && services.length === 0) {
      return DUMMY_HEALTHCARE_SERVICES_DATA
    }

    // 6. Compute stats
    const stats = computeStats(doctors, beds, services)

    return { stats, doctors, beds, services }
  } catch (error) {
    console.warn("Failed to fetch live healthcare services data, falling back to dummy data:", error)
    return DUMMY_HEALTHCARE_SERVICES_DATA
  }
}

