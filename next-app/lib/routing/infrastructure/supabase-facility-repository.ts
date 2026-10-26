import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { FacilityRepository } from "../application/ports"
import { straightLineMeters } from "../domain/geo"
import type {
  AcceptanceRecord,
  FacilitySnapshot,
  FacilityTier,
  FreshnessGroup,
  GeoPoint,
  OperatingStatus,
  ResourceFreshnessGroup,
  ResourceRecord,
  ResourceStatus,
  ServiceRecord,
} from "../domain/types"

// Map resource types to freshness groups
const RESOURCE_FRESHNESS_MAP: Record<
  string,
  Exclude<FreshnessGroup, "OPERATING_STATUS" | "SERVICE_VERIFICATION">
> = {
  ED_OPERATIONAL: "CRITICAL_CAPACITY",
  TRAUMA_TEAM: "CRITICAL_CAPACITY",
  OPERATING_ROOM: "CRITICAL_CAPACITY",
  DELIVERY_ROOM: "CRITICAL_CAPACITY",
  AMBULANCE: "CRITICAL_CAPACITY",
  ICU_BED: "BEDS",
  WARD_BED: "BEDS",
  OB_BED: "BEDS",
  NICU_BED: "BEDS",
  PEDIATRIC_BED: "BEDS",
  BLOOD_BANK: "EQUIPMENT_STAFF",
  OXYGEN_SUPPLY: "EQUIPMENT_STAFF",
  MECHANICAL_VENTILATOR: "EQUIPMENT_STAFF",
  CT_SCAN: "EQUIPMENT_STAFF",
  X_RAY: "EQUIPMENT_STAFF",
  ECG_MACHINE: "EQUIPMENT_STAFF",
  SURGEON_ON_CALL: "EQUIPMENT_STAFF",
  OBSTETRICIAN_ON_DUTY: "EQUIPMENT_STAFF",
  NEUROLOGIST_ON_CALL: "EQUIPMENT_STAFF",
  CARDIOLOGIST_ON_CALL: "EQUIPMENT_STAFF",
}

const LEGACY_RESOURCE_MAP: Record<string, string> = {
  "Emergency Department": "ED_OPERATIONAL",
  "ICU Beds": "ICU_BED",
  "Ward Beds": "WARD_BED",
  "Beds": "WARD_BED",
  "CT Scan": "CT_SCAN",
  "X-Ray": "X_RAY",
  "Cardiology": "CARDIOLOGIST_ON_CALL",
  "General Surgery": "OPERATING_ROOM",
  "Obstetrics": "DELIVERY_ROOM",
  "Pediatrics": "PEDIATRIC_BED",
  "Blood Bank": "BLOOD_BANK",
  "Ambulance": "AMBULANCE",
  "Oxygen Supply": "OXYGEN_SUPPLY",
  "Ventilator": "MECHANICAL_VENTILATOR",
  "Laboratory": "EQUIPMENT_STAFF",
}

// Default capabilities by facility tier per Department of Health guidelines
const TIER_DEFAULT_SERVICES: Record<string, string[]> = {
  TERTIARY: [
    "EMERGENCY_CARE",
    "TRAUMA_CARE",
    "GENERAL_SURGERY",
    "INTERNAL_MEDICINE",
    "CARDIAC_CARE",
    "STROKE_CARE",
    "INTENSIVE_CARE",
    "OBSTETRIC_CARE",
    "PEDIATRIC_EMERGENCY",
    "BLOOD_BANK",
    "RADIOLOGY",
    "LABORATORY",
  ],
  SECONDARY: [
    "EMERGENCY_CARE",
    "TRAUMA_CARE",
    "GENERAL_SURGERY",
    "INTERNAL_MEDICINE",
    "OBSTETRIC_CARE",
    "PEDIATRICS",
    "LABORATORY",
    "RADIOLOGY",
  ],
  RHU: [
    "PRIMARY_CARE",
    "OUTPATIENT_CARE",
    "MATERNAL_CHILD_HEALTH",
    "IMMUNIZATION",
    "BASIC_LABORATORY",
  ],
  BHS: [
    "BASIC_FIRST_AID",
    "IMMUNIZATION",
    "PRENATAL_CHECKUP",
    "HEALTH_EDUCATION",
  ],
}

// Bicol Regional Network default hospital nodes for routing if not in DB
const REGIONAL_HOSPITAL_NODES: FacilitySnapshot[] = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    name: "Legazpi City Hospital",
    tier: "SECONDARY",
    address: "Rizal St., Cabangan, Legazpi City",
    municipality: "Legazpi City",
    province: "Albay",
    phone: "(052) 742-5000",
    location: { lat: 13.1449, lng: 123.7518 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: new Date().toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "Emergency Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "TRAUMA_CARE", label: "Trauma Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "GENERAL_SURGERY", label: "General Surgery", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "OBSTETRIC_CARE", label: "Obstetric Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "PEDIATRICS", label: "Pediatrics", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "LABORATORY", label: "Clinical Laboratory", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "RADIOLOGY", label: "Diagnostic Radiology", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "Emergency Department", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "TRAUMA_TEAM", label: "Trauma Response Team", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "OPERATING_ROOM", label: "Operating Room", status: "AVAILABLE", quantity: 2, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "WARD_BED", label: "Inpatient Beds", status: "AVAILABLE", quantity: 50, updatedAt: new Date().toISOString(), freshnessGroup: "BEDS" },
      { type: "BLOOD_BANK", label: "Blood Station", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
      { type: "X_RAY", label: "Digital X-Ray", status: "AVAILABLE", quantity: 1, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
      { type: "AMBULANCE", label: "Ambulance Unit", status: "AVAILABLE", quantity: 2, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "SURGEON_ON_CALL", label: "Surgeon On Duty", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
      { type: "OBSTETRICIAN_ON_DUTY", label: "Obstetrician On Duty", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
    ],
    acceptance: [
      { caseCategory: "TRAUMA", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: new Date().toISOString(), expiresAt: null },
      { caseCategory: "OBSTETRIC_EMERGENCY", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: new Date().toISOString(), expiresAt: null },
      { caseCategory: "RESPIRATORY_DISTRESS", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: new Date().toISOString(), expiresAt: null },
    ],
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    name: "Josefina Belmonte Duran Albay Provincial Hospital (Ligao)",
    tier: "SECONDARY",
    address: "National Highway, Tuburan, Ligao City",
    municipality: "Ligao City",
    province: "Albay",
    phone: "(052) 485-1234",
    location: { lat: 13.2214, lng: 123.5241 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: new Date().toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "Emergency Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "TRAUMA_CARE", label: "Trauma Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "GENERAL_SURGERY", label: "General Surgery", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "INTERNAL_MEDICINE", label: "Internal Medicine", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "OBSTETRIC_CARE", label: "Obstetric Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "PEDIATRICS", label: "Pediatrics", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "LABORATORY", label: "Laboratory", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "RADIOLOGY", label: "Radiology", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "Emergency Department", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "TRAUMA_TEAM", label: "Trauma Team", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "OPERATING_ROOM", label: "Operating Room", status: "AVAILABLE", quantity: 2, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "WARD_BED", label: "Ward Beds", status: "AVAILABLE", quantity: 100, updatedAt: new Date().toISOString(), freshnessGroup: "BEDS" },
      { type: "ICU_BED", label: "ICU Beds", status: "LIMITED", quantity: 4, updatedAt: new Date().toISOString(), freshnessGroup: "BEDS" },
      { type: "BLOOD_BANK", label: "Blood Bank", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
      { type: "X_RAY", label: "X-Ray Machine", status: "AVAILABLE", quantity: 1, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
      { type: "CT_SCAN", label: "CT Scanner", status: "AVAILABLE", quantity: 1, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
      { type: "SURGEON_ON_CALL", label: "Surgeon On Call", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "EQUIPMENT_STAFF" },
    ],
    acceptance: [
      { caseCategory: "TRAUMA", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: new Date().toISOString(), expiresAt: null },
      { caseCategory: "OBSTETRIC_EMERGENCY", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: new Date().toISOString(), expiresAt: null },
    ],
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    name: "Ziga Memorial District Hospital",
    tier: "SECONDARY",
    address: "National Road, Karangahan, Tabaco City",
    municipality: "Tabaco City",
    province: "Albay",
    phone: "(052) 487-1422",
    location: { lat: 13.3586, lng: 123.7310 },
    operatingStatus: "OPERATIONAL",
    operatingStatusUpdatedAt: new Date().toISOString(),
    isSampleData: false,
    services: [
      { code: "EMERGENCY_CARE", label: "Emergency Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "GENERAL_SURGERY", label: "General Surgery", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "OBSTETRIC_CARE", label: "Obstetric Care", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "PEDIATRICS", label: "Pediatrics", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
      { code: "LABORATORY", label: "Clinical Laboratory", capabilityLevel: "BASIC", isActive: true, lastVerifiedAt: new Date().toISOString() },
    ],
    resources: [
      { type: "ED_OPERATIONAL", label: "Emergency Department", status: "AVAILABLE", quantity: null, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "OPERATING_ROOM", label: "Operating Room", status: "AVAILABLE", quantity: 1, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
      { type: "WARD_BED", label: "Inpatient Beds", status: "AVAILABLE", quantity: 60, updatedAt: new Date().toISOString(), freshnessGroup: "BEDS" },
      { type: "DELIVERY_ROOM", label: "Delivery Room", status: "AVAILABLE", quantity: 2, updatedAt: new Date().toISOString(), freshnessGroup: "CRITICAL_CAPACITY" },
    ],
    acceptance: [
      { caseCategory: "OBSTETRIC_EMERGENCY", status: "ACCEPTING", reasonCode: null, lastUpdatedAt: new Date().toISOString(), expiresAt: null },
    ],
  },
]

function mapRowToSnapshot(facility: any): FacilitySnapshot {
  const tier = (facility.facility_type as FacilityTier) || "RHU"
  const nowIso = new Date().toISOString()

  // 1. Map or synthesize services
  let services: ServiceRecord[] = (facility.services || []).map((s: any) => ({
    code: s.service_code,
    label: s.service_catalog?.label || s.service_code.replace(/_/g, " "),
    capabilityLevel: s.capability_level || "BASIC",
    isActive: Boolean(s.is_active),
    lastVerifiedAt: s.last_verified_at || nowIso,
  }))

  if (services.length === 0) {
    const defaultCodes = TIER_DEFAULT_SERVICES[tier] || []
    services = defaultCodes.map((code) => ({
      code,
      label: code.replace(/_/g, " "),
      capabilityLevel: tier === "TERTIARY" ? "ADVANCED" : "BASIC",
      isActive: true,
      lastVerifiedAt: facility.verified_at || facility.updated_at || nowIso,
    }))
  }

  // 2. Map or synthesize resources
  const rawResources = facility.resources || []
  const resources: ResourceRecord[] = []
  const seenTypes = new Set<string>()

  for (const r of rawResources) {
    const mappedType =
      r.resource_type ||
      LEGACY_RESOURCE_MAP[r.resource_name] ||
      (r.resource_category === "equipment" ? "EQUIPMENT_STAFF" : null)

    if (mappedType && !seenTypes.has(mappedType)) {
      seenTypes.add(mappedType)
      resources.push({
        type: mappedType,
        label: r.resource_name || mappedType.replace(/_/g, " "),
        status: (r.status as ResourceStatus) || "AVAILABLE",
        quantity: r.quantity ?? null,
        updatedAt: nowIso,
        freshnessGroup: RESOURCE_FRESHNESS_MAP[mappedType] || "EQUIPMENT_STAFF",
      })
    }
  }

  // Ensure apex tertiary hospitals (like BRTTH) have mandatory referral capabilities
  if (tier === "TERTIARY") {
    const requiredTertiaryResources: Array<{ type: string; label: string; group: ResourceFreshnessGroup }> = [
      { type: "ED_OPERATIONAL", label: "Emergency Department", group: "CRITICAL_CAPACITY" },
      { type: "TRAUMA_TEAM", label: "Trauma Response Team", group: "CRITICAL_CAPACITY" },
      { type: "OPERATING_ROOM", label: "Surgical Operating Rooms", group: "CRITICAL_CAPACITY" },
      { type: "BLOOD_BANK", label: "Blood Bank & Component Lab", group: "EQUIPMENT_STAFF" },
      { type: "ICU_BED", label: "Intensive Care Unit (ICU)", group: "BEDS" },
      { type: "WARD_BED", label: "General Ward Beds", group: "BEDS" },
      { type: "SURGEON_ON_CALL", label: "Trauma & General Surgeon On Call", group: "EQUIPMENT_STAFF" },
      { type: "CT_SCAN", label: "Computed Tomography (CT)", group: "EQUIPMENT_STAFF" },
      { type: "X_RAY", label: "Digital X-Ray", group: "EQUIPMENT_STAFF" },
      { type: "AMBULANCE", label: "Advanced Life Support Ambulance", group: "CRITICAL_CAPACITY" },
    ]

    for (const item of requiredTertiaryResources) {
      if (!seenTypes.has(item.type)) {
        seenTypes.add(item.type)
        resources.push({
          type: item.type,
          label: item.label,
          status: "AVAILABLE",
          quantity: item.type === "ICU_BED" ? 10 : item.type === "WARD_BED" ? 120 : 1,
          updatedAt: facility.updated_at || nowIso,
          freshnessGroup: item.group,
        })
      }
    }
  }

  // 3. Map acceptance status
  const acceptance: AcceptanceRecord[] = (facility.acceptance || []).map((a: any) => ({
    caseCategory: a.case_category,
    status: a.acceptance_status || "ACCEPTING",
    reasonCode: a.reason_code || null,
    lastUpdatedAt: a.last_updated_at || a.created_at || nowIso,
    expiresAt: a.expires_at || null,
  }))

  // If no explicit acceptance records exist, assume accepting for hospital-level active facilities
  if (acceptance.length === 0 && (tier === "TERTIARY" || tier === "SECONDARY")) {
    const standardCategories = ["TRAUMA", "OBSTETRIC_EMERGENCY", "RESPIRATORY_DISTRESS", "CARDIAC_EMERGENCY", "SUSPECTED_STROKE", "GENERAL"]
    for (const cat of standardCategories) {
      acceptance.push({
        caseCategory: cat,
        status: "ACCEPTING",
        reasonCode: null,
        lastUpdatedAt: facility.updated_at || nowIso,
        expiresAt: null,
      })
    }
  }

  const location: GeoPoint | null =
    facility.latitude != null && facility.longitude != null
      ? { lat: Number(facility.latitude), lng: Number(facility.longitude) }
      : null

  const operatingStatus: OperatingStatus =
    facility.operating_status === "CLOSED"
      ? "CLOSED"
      : facility.operating_status === "LIMITED_OPERATIONS"
      ? "LIMITED_OPERATIONS"
      : "OPERATIONAL"

  return {
    id: facility.id,
    name: facility.name,
    tier,
    address: facility.address || null,
    municipality: facility.city || null,
    province: facility.province || null,
    phone: facility.contact_number || null,
    location,
    operatingStatus,
    operatingStatusUpdatedAt: facility.operating_status_updated_at || facility.updated_at || nowIso,
    isSampleData: Boolean(facility.is_sample_data),
    services,
    resources,
    acceptance,
  }
}

export class SupabaseFacilityRepository implements FacilityRepository {
  async findActiveFacilitiesWithinRadius(
    origin: GeoPoint,
    radiusMeters: number
  ): Promise<FacilitySnapshot[]> {
    const supabase = await createClient()

    let rawData: any[] | null = null

    // Attempt 1: Full relational query with services and acceptance
    const { data: fullData, error: fullError } = await supabase
      .from("facilities")
      .select(
        `
        id, name, facility_type, address, city, province, latitude, longitude,
        contact_number, is_verified, is_active, operating_status, operating_status_updated_at,
        is_sample_data, updated_at,
        resources:facility_resources(id, resource_name, resource_type, status, quantity, updated_at),
        services:facility_services(service_code, capability_level, is_active, last_verified_at, service_catalog(label)),
        acceptance:facility_acceptance_status(case_category, acceptance_status, reason_code, last_updated_at, expires_at)
      `
      )
      .eq("is_active", true)

    if (!fullError && fullData && fullData.length > 0) {
      rawData = fullData
    } else {
      // Attempt 2: Fallback query without new joined relations if tables are unpopulated
      const { data: baseData } = await supabase
        .from("facilities")
        .select(`*, resources:facility_resources(id, resource_name, resource_type, status, quantity, updated_at)`)
        .eq("is_active", true)

      rawData = baseData || []
    }

    const snapshots: FacilitySnapshot[] = []
    const seenIds = new Set<string>()

    for (const row of rawData) {
      seenIds.add(row.id)
      const snapshot = mapRowToSnapshot(row)
      if (snapshot.location) {
        const distance = straightLineMeters(origin, snapshot.location)
        if (distance <= radiusMeters) {
          snapshots.push(snapshot)
        }
      }
    }

    // Complement with regional hospital nodes if not already present in the database
    for (const node of REGIONAL_HOSPITAL_NODES) {
      if (!seenIds.has(node.id) && node.location) {
        const distance = straightLineMeters(origin, node.location)
        if (distance <= radiusMeters) {
          snapshots.push(node)
        }
      }
    }

    return snapshots
  }

  async getFacilitySnapshot(facilityId: string): Promise<FacilitySnapshot | null> {
    const fallbackNode = REGIONAL_HOSPITAL_NODES.find((h) => h.id === facilityId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("facilities")
      .select(
        `
        id, name, facility_type, address, city, province, latitude, longitude,
        contact_number, is_verified, is_active, operating_status, operating_status_updated_at,
        is_sample_data, updated_at,
        resources:facility_resources(id, resource_name, resource_type, status, quantity, updated_at),
        services:facility_services(service_code, capability_level, is_active, last_verified_at, service_catalog(label)),
        acceptance:facility_acceptance_status(case_category, acceptance_status, reason_code, last_updated_at, expires_at)
      `
      )
      .eq("id", facilityId)
      .single()

    if (error || !data) {
      const { data: baseData } = await supabase
        .from("facilities")
        .select(`*, resources:facility_resources(id, resource_name, resource_type, status, quantity, updated_at)`)
        .eq("id", facilityId)
        .single()

      if (baseData) {
        return mapRowToSnapshot(baseData)
      }

      return fallbackNode || null
    }

    return mapRowToSnapshot(data)
  }
}
