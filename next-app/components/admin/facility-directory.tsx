"use client"

import { useState, useMemo } from "react"
import {
  Building2,
  Search,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Package,
  Stethoscope,
  Users,
} from "lucide-react"
import { FACILITY_THEMES, type FacilityType } from "@/lib/constants/facility-themes"
import type { OperatingStatus } from "@/lib/types/database"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FacilityWithDetails {
  id: string
  name: string
  facility_type: FacilityType
  address: string | null
  city: string | null
  province: string | null
  contact_number: string | null
  email: string | null
  is_active: boolean
  operating_status: OperatingStatus
  resources: {
    id: string
    resource_name: string
    resource_category: string | null
    status: string
    quantity: number | null
  }[]
  services: {
    id: string
    service_code: string
    capability_level: string
    is_active: boolean
  }[]
  user_count: { count: number }[]
}

interface AdminFacilityDirectoryProps {
  facilities: FacilityWithDetails[]
}

// ─── Operating Status Styles ─────────────────────────────────────────────────

const OPERATING_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  OPERATIONAL: {
    bg: "bg-green-50",
    text: "text-green-700",
    label: "Operational",
  },
  LIMITED_OPERATIONS: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    label: "Limited",
  },
  CLOSED: {
    bg: "bg-red-50",
    text: "text-red-700",
    label: "Closed",
  },
  UNKNOWN: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    label: "Unknown",
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminFacilityDirectory({
  facilities,
}: AdminFacilityDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FacilityType | "ALL">("ALL")

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        searchQuery === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.province?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType =
        typeFilter === "ALL" || f.facility_type === typeFilter
      return matchesSearch && matchesType
    })
  }, [facilities, searchQuery, typeFilter])

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, city, or province..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "BHS", "RHU", "SECONDARY", "TERTIARY"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === type
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type === "ALL" ? "All" : type}
              </button>
            )
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredFacilities.length} of {facilities.length} facilities
      </p>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredFacilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No facilities match your search criteria
        </div>
      )}
    </div>
  )
}

// ─── Facility Card ───────────────────────────────────────────────────────────

function FacilityCard({ facility }: { facility: FacilityWithDetails }) {
  const theme = FACILITY_THEMES[facility.facility_type]
  const opStatus =
    OPERATING_STATUS_STYLES[facility.operating_status] ??
    OPERATING_STATUS_STYLES.UNKNOWN

  const availableResources = facility.resources.filter(
    (r) => r.status === "AVAILABLE"
  ).length
  const totalResources = facility.resources.length
  const activeServices = facility.services.filter((s) => s.is_active).length
  const userCount = facility.user_count?.[0]?.count ?? 0

  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2
              className="h-4 w-4 shrink-0"
              style={{ color: theme.primary }}
            />
            <h3 className="truncate text-sm font-medium text-foreground">
              {facility.name}
            </h3>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: theme.light, color: theme.dark }}
            >
              {theme.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${opStatus.bg} ${opStatus.text}`}
            >
              {opStatus.label}
            </span>
          </div>
        </div>
        {facility.is_active ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
        )}
      </div>

      {/* Location */}
      {(facility.city || facility.province) && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {[facility.address, facility.city, facility.province]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
      )}

      {/* Contact */}
      {facility.contact_number && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          {facility.contact_number}
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 border-t border-border/50 pt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>
            {availableResources}/{totalResources} resources
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Stethoscope className="h-3 w-3" />
          <span>{activeServices} services</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{userCount} users</span>
        </div>
      </div>
    </div>
  )
}
