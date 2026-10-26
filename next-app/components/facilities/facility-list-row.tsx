"use client"

import Link from "next/link"
import {
  Building2,
  MapPin,
  Phone,
  Compass,
  ArrowRight,
  Info,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import type { DirectoryFacility } from "./facility-types"

export function FacilityListRow({
  facility,
  isOwnFacility = false,
  onRouteHere,
  onViewDetails,
}: {
  facility: DirectoryFacility
  isOwnFacility?: boolean
  onRouteHere?: (facility: DirectoryFacility) => void
  onViewDetails?: (facility: DirectoryFacility) => void
}) {
  const isOperational =
    !facility.operating_status ||
    facility.operating_status === "OPERATIONAL"

  const availableServices = (facility.resources || []).filter(
    (r) => r.status === "AVAILABLE" || r.status === "LIMITED"
  )

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-xs ${
        isOwnFacility
          ? "border-emerald-400 bg-emerald-50/20 ring-1 ring-emerald-300"
          : "border-border"
      }`}
    >
      {/* Left: Facility Name & Badges */}
      <div className="space-y-1 sm:max-w-xs md:max-w-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <h4 className="text-sm font-bold text-slate-900">{facility.name}</h4>
          {isOwnFacility && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Your Station
            </span>
          )}
          {facility.is_verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 font-medium">
              <ShieldCheck className="h-3 w-3" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <FacilityTypeBadge type={facility.facility_type} />
          <span className="flex items-center gap-1 text-[11px] text-slate-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOperational ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isOperational ? "Operational" : facility.operating_status}
          </span>
        </div>
      </div>

      {/* Middle: Location & Contact */}
      <div className="space-y-1 text-xs text-muted-foreground sm:w-48">
        <div className="flex items-center gap-1 text-slate-700">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{facility.city}, {facility.province}</span>
        </div>
        {facility.contact_number && (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
            <a href={`tel:${facility.contact_number}`} className="text-emerald-700 hover:underline">
              {facility.contact_number}
            </a>
          </div>
        )}
      </div>

      {/* Services summary */}
      <div className="hidden lg:flex flex-wrap gap-1 max-w-xs">
        {availableServices.slice(0, 3).map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700"
          >
            <CheckCircle2 className="h-2 w-2 text-emerald-600" />
            {r.resource_name}
          </span>
        ))}
        {availableServices.length > 3 && (
          <span className="text-[10px] text-muted-foreground self-center">
            +{availableServices.length - 3}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onViewDetails && onViewDetails(facility)}
          className="p-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
          title="View Details"
        >
          <Info className="h-4 w-4" />
        </button>

        {onRouteHere && facility.latitude && facility.longitude && (
          <button
            type="button"
            onClick={() => onRouteHere(facility)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Route</span>
          </button>
        )}

        <Link
          href={`/dashboard/referrals/create?facilityId=${facility.id}`}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
        >
          <span>Refer</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
