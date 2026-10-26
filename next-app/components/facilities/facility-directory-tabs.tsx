"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import {
  Compass,
  Building2,
  Sparkles,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"
import { HospitalMap } from "@/components/routing/hospital-map"
import { HospitalRecommendations } from "@/components/routing/hospital-recommendations"
import { PatientAssessmentForm } from "@/components/routing/patient-assessment-form"
import { FacilityStatsHeader } from "./facility-stats"
import { FacilityFilters } from "./facility-filters"
import { FacilityCard } from "./facility-card"
import { FacilityListRow } from "./facility-list-row"
import { FacilityDetailModal } from "./facility-detail-modal"
import type {
  DirectoryFacility,
  FacilityFilterState,
} from "./facility-types"
import type {
  GeoPoint,
  RankedFacility,
  RankingResult,
  Urgency,
} from "@/lib/routing/domain/types"

const REGIONAL_HOSPITAL_NETWORK: DirectoryFacility[] = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    name: "Legazpi City Hospital",
    facility_type: "SECONDARY",
    address: "Rizal St., Cabangan, Legazpi City",
    city: "Legazpi City",
    province: "Albay",
    contact_number: "(052) 742-5000",
    email: "legazpicityhospital@albay.gov.ph",
    latitude: 13.1449,
    longitude: 123.7518,
    is_verified: true,
    operating_status: "OPERATIONAL",
    resources: [
      { id: "r-lch-1", resource_name: "Emergency Department", status: "AVAILABLE", resource_category: "service" },
      { id: "r-lch-2", resource_name: "General Surgery", status: "AVAILABLE", resource_category: "specialty" },
      { id: "r-lch-3", resource_name: "Ward Beds", status: "AVAILABLE", quantity: 50, resource_category: "bed" },
      { id: "r-lch-4", resource_name: "X-Ray", status: "AVAILABLE", quantity: 1, resource_category: "equipment" },
      { id: "r-lch-5", resource_name: "Clinical Laboratory", status: "AVAILABLE", resource_category: "service" },
      { id: "r-lch-6", resource_name: "Ambulance", status: "AVAILABLE", quantity: 2, resource_category: "equipment" },
    ],
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    name: "Josefina Belmonte Duran Albay Provincial Hospital (Ligao)",
    facility_type: "SECONDARY",
    address: "National Highway, Tuburan, Ligao City",
    city: "Ligao City",
    province: "Albay",
    contact_number: "(052) 485-1234",
    email: "jbdaph.ligao@albay.gov.ph",
    latitude: 13.2214,
    longitude: 123.5241,
    is_verified: true,
    operating_status: "OPERATIONAL",
    resources: [
      { id: "r-ligao-1", resource_name: "Emergency Department", status: "AVAILABLE", resource_category: "service" },
      { id: "r-ligao-2", resource_name: "Trauma Team", status: "AVAILABLE", resource_category: "service" },
      { id: "r-ligao-3", resource_name: "Operating Room", status: "AVAILABLE", quantity: 2, resource_category: "service" },
      { id: "r-ligao-4", resource_name: "Ward Beds", status: "AVAILABLE", quantity: 100, resource_category: "bed" },
      { id: "r-ligao-5", resource_name: "ICU Beds", status: "LIMITED", quantity: 4, resource_category: "bed" },
      { id: "r-ligao-6", resource_name: "CT Scan", status: "AVAILABLE", quantity: 1, resource_category: "equipment" },
      { id: "r-ligao-7", resource_name: "Digital X-Ray", status: "AVAILABLE", quantity: 1, resource_category: "equipment" },
    ],
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    name: "Ziga Memorial District Hospital",
    facility_type: "SECONDARY",
    address: "National Road, Karangahan, Tabaco City",
    city: "Tabaco City",
    province: "Albay",
    contact_number: "(052) 487-1422",
    email: "zmdh.tabaco@albay.gov.ph",
    latitude: 13.3586,
    longitude: 123.7310,
    is_verified: true,
    operating_status: "OPERATIONAL",
    resources: [
      { id: "r-ziga-1", resource_name: "Emergency Department", status: "AVAILABLE", resource_category: "service" },
      { id: "r-ziga-2", resource_name: "General Surgery", status: "AVAILABLE", resource_category: "specialty" },
      { id: "r-ziga-3", resource_name: "Ward Beds", status: "AVAILABLE", quantity: 60, resource_category: "bed" },
      { id: "r-ziga-4", resource_name: "Delivery Room", status: "AVAILABLE", quantity: 2, resource_category: "service" },
      { id: "r-ziga-5", resource_name: "Clinical Laboratory", status: "AVAILABLE", resource_category: "service" },
    ],
  },
]

export function FacilityDirectoryTabs({
  initialFacilities,
  currentUserId,
  currentUserFacilityId,
}: {
  initialFacilities: any[]
  currentUserId: string
  currentUserFacilityId?: string | null
}) {
  const [activeTab, setActiveTab] = useState<"routing" | "directory">("routing")

  // Combine DB facilities with regional hospital nodes so directory is comprehensive
  const allFacilities = useMemo<DirectoryFacility[]>(() => {
    const existingIds = new Set(initialFacilities.map((f) => f.id))
    const merged: DirectoryFacility[] = [...initialFacilities]

    for (const h of REGIONAL_HOSPITAL_NETWORK) {
      if (!existingIds.has(h.id)) {
        merged.push(h)
      }
    }

    return merged
  }, [initialFacilities])

  // Recommendation engine state
  const defaultOrigin: GeoPoint = useMemo(() => {
    const userFac = allFacilities.find((f) => f.id === currentUserFacilityId)
    if (userFac?.latitude && userFac?.longitude) {
      return { lat: Number(userFac.latitude), lng: Number(userFac.longitude) }
    }
    return { lat: 13.1579, lng: 123.6986 } // Default near Daraga/Legazpi
  }, [allFacilities, currentUserFacilityId])

  const [origin, setOrigin] = useState<GeoPoint>(defaultOrigin)
  const [ranking, setRanking] = useState<RankingResult | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null)

  // Directory filter state
  const [filters, setFilters] = useState<FacilityFilterState>({
    query: "",
    tier: "ALL",
    status: "ALL",
    serviceTag: "ALL",
    viewMode: "grid",
    sortBy: "name",
  })

  // Modal inspection state
  const [detailFacility, setDetailFacility] = useState<DirectoryFacility | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Run recommendation query
  const runRecommendation = async (params: {
    origin: GeoPoint
    caseCategory: string
    urgency: Urgency
    extraRequiredResources: string[]
  }) => {
    setIsLoading(true)
    setOrigin(params.origin)

    try {
      const res = await fetch("/api/referrals/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (res.ok) {
        const data = await res.json()
        setRanking(data.ranking)
        setRunId(data.runId)
        if (data.ranking?.recommended) {
          setSelectedHospitalId(data.ranking.recommended.facility.id)
        } else if (data.ranking?.alternatives?.[0]) {
          setSelectedHospitalId(data.ranking.alternatives[0].facility.id)
        }
      }
    } catch (err) {
      console.warn("Failed to fetch recommendation:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial recommendation run on mount
  useEffect(() => {
    runRecommendation({
      origin: defaultOrigin,
      caseCategory: "TRAUMA",
      urgency: "EMERGENCY",
      extraRequiredResources: [],
    })
  }, [defaultOrigin])

  // Filtered facilities for Directory tab
  const filteredFacilities = useMemo(() => {
    return allFacilities
      .filter((facility) => {
        // Query match
        const q = filters.query.toLowerCase().trim()
        if (q) {
          const matchName = facility.name.toLowerCase().includes(q)
          const matchCity = (facility.city || "").toLowerCase().includes(q)
          const matchProv = (facility.province || "").toLowerCase().includes(q)
          const matchType = facility.facility_type.toLowerCase().includes(q)
          const matchService = (facility.resources || []).some((r) =>
            r.resource_name.toLowerCase().includes(q)
          )
          if (!matchName && !matchCity && !matchProv && !matchType && !matchService) {
            return false
          }
        }

        // Tier match
        if (filters.tier !== "ALL") {
          if (filters.tier === "HOSPITALS") {
            if (facility.facility_type !== "TERTIARY" && facility.facility_type !== "SECONDARY") {
              return false
            }
          } else if (facility.facility_type !== filters.tier) {
            return false
          }
        }

        // Status match
        if (filters.status !== "ALL") {
          const isOp = !facility.operating_status || facility.operating_status === "OPERATIONAL"
          if (filters.status === "OPERATIONAL" && !isOp) return false
          if (filters.status === "LIMITED" && facility.operating_status !== "LIMITED_OPERATIONS") return false
          if (filters.status === "CLOSED" && facility.operating_status !== "CLOSED") return false
        }

        // Service capability match
        if (filters.serviceTag !== "ALL") {
          const resNames = (facility.resources || []).map((r) => r.resource_name.toLowerCase())
          if (filters.serviceTag === "EMERGENCY") {
            const hasER = resNames.some((n) => n.includes("emergency") || n.includes("er"))
            if (!hasER && facility.facility_type !== "TERTIARY" && facility.facility_type !== "SECONDARY") {
              return false
            }
          } else if (filters.serviceTag === "SURGERY") {
            const hasSurg = resNames.some((n) => n.includes("surgery") || n.includes("operating"))
            if (!hasSurg) return false
          } else if (filters.serviceTag === "ICU") {
            const hasIcu = resNames.some((n) => n.includes("icu"))
            if (!hasIcu) return false
          } else if (filters.serviceTag === "MATERNAL") {
            const hasMat = resNames.some((n) => n.includes("obstetric") || n.includes("delivery") || n.includes("prenatal"))
            if (!hasMat) return false
          } else if (filters.serviceTag === "DIAGNOSTICS") {
            const hasDiag = resNames.some((n) => n.includes("ct") || n.includes("x-ray") || n.includes("laboratory"))
            if (!hasDiag) return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (filters.sortBy === "name") {
          return a.name.localeCompare(b.name)
        }
        if (filters.sortBy === "tier") {
          const tierWeight: Record<string, number> = { TERTIARY: 1, SECONDARY: 2, RHU: 3, BHS: 4 }
          return (tierWeight[a.facility_type] || 9) - (tierWeight[b.facility_type] || 9)
        }
        if (filters.sortBy === "municipality") {
          return (a.city || "").localeCompare(b.city || "")
        }
        return 0
      })
  }, [allFacilities, filters])

  // Open modal
  const handleOpenDetails = (facility: DirectoryFacility) => {
    setDetailFacility(facility)
    setIsDetailOpen(true)
  }

  // Handle "Route Here" click from Directory
  const handleRouteToFacility = (facility: DirectoryFacility) => {
    setActiveTab("routing")
    if (facility.latitude && facility.longitude) {
      setSelectedHospitalId(facility.id)
    }
  }

  // Map candidates list
  const mapHospitals: RankedFacility[] = useMemo(() => {
    if (!ranking) return []
    return [
      ...(ranking.recommended ? [ranking.recommended] : []),
      ...ranking.alternatives,
      ...ranking.unverified,
      ...ranking.excluded,
    ]
  }, [ranking])

  return (
    <div className="space-y-6">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("routing")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
              activeTab === "routing"
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : "bg-white text-slate-700 border border-border hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Smart Hospital Recommendation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
              activeTab === "directory"
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : "bg-white text-slate-700 border border-border hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Facility Directory ({allFacilities.length})</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Albay Health Referral Network (Live)</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SMART HOSPITAL RECOMMENDATION                         */}
      {/* ============================================================ */}
      {activeTab === "routing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Patient Assessment Input */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1.5 shadow-xs">
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Intelligent Referral Matching Engine
              </h2>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Evaluates patient urgency against verified hospital services, operating suites,
                ICU/ward bed capacity, and real-time road driving travel time via OSRM & Google Routes.
              </p>
            </div>

            <PatientAssessmentForm onSubmit={runRecommendation} isLoading={isLoading} />
          </div>

          {/* Right Column: Interactive Map & Live Ranked Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Interactive Map with Routes and Markers */}
            <HospitalMap
              origin={origin}
              hospitals={mapHospitals}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={(h) => setSelectedHospitalId(h.facility.id)}
            />

            {/* Recommendations List Container */}
            {isLoading ? (
              <div className="rounded-2xl border border-border bg-white p-10 text-center space-y-3 shadow-xs">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" />
                <p className="text-xs font-bold text-slate-800">
                  Calculating live road travel times and verifying clinical capabilities...
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Evaluating trauma teams, operating rooms, ICU beds, and direct road paths across Albay.
                </p>
              </div>
            ) : ranking ? (
              <HospitalRecommendations
                ranking={ranking}
                runId={runId}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={(h) => setSelectedHospitalId(h.facility.id)}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: FACILITY DIRECTORY & CAPABILITIES BROWSER             */}
      {/* ============================================================ */}
      {activeTab === "directory" && (
        <div className="space-y-5">
          {/* Top KPI Statistics */}
          <FacilityStatsHeader facilities={allFacilities} />

          {/* Filters, Search, Sort & View Mode */}
          <FacilityFilters
            filters={filters}
            onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
            totalResults={filteredFacilities.length}
          />

          {/* Results Display */}
          {filteredFacilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No facilities match your filters</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try clearing your search terms or selecting &ldquo;All Facilities&rdquo; to browse the full Bicol network.
              </p>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    query: "",
                    tier: "ALL",
                    status: "ALL",
                    serviceTag: "ALL",
                    viewMode: filters.viewMode,
                    sortBy: "name",
                  })
                }
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : filters.viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  isOwnFacility={facility.id === currentUserFacilityId}
                  onRouteHere={handleRouteToFacility}
                  onViewDetails={handleOpenDetails}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFacilities.map((facility) => (
                <FacilityListRow
                  key={facility.id}
                  facility={facility}
                  isOwnFacility={facility.id === currentUserFacilityId}
                  onRouteHere={handleRouteToFacility}
                  onViewDetails={handleOpenDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Inspection Modal */}
      <FacilityDetailModal
        facility={detailFacility}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRouteHere={handleRouteToFacility}
      />
    </div>
  )
}
