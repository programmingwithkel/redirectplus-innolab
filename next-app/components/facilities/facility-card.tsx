"use client"

import Link from "next/link"
import {
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Info,
  ShieldCheck,
  Bed,
  Ambulance,
} from "lucide-react"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import type { DirectoryFacility } from "./facility-types"

export function FacilityCard({
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
  const availableServices = (facility.resources || []).filter(
    (r) => r.status === "AVAILABLE" || r.status === "LIMITED"
  )

  const isOperational =
    !facility.operating_status ||
    facility.operating_status === "OPERATIONAL"

  // Bed stats
  const bedResource = (facility.resources || []).find((r) =>
    (r.resource_name || "").toLowerCase().includes("bed") && !r.resource_name.toLowerCase().includes("icu")
  )
  const icuResource = (facility.resources || []).find((r) =>
    (r.resource_name || "").toLowerCase().includes("icu")
  )

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isOwnFacility
          ? "border-emerald-400 bg-emerald-50/20 ring-2 ring-emerald-200"
          : "border-border hover:border-slate-300"
      }`}
    >
      <div>
        {/* Top Header: Name, Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {facility.name}
              </h3>
              {isOwnFacility && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Your Station
                </span>
              )}
              {facility.is_verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200" title="DOH Verified Referral Node">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <FacilityTypeBadge type={facility.facility_type} />
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOperational ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {isOperational ? "Operational" : facility.operating_status}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 p-2 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
        </div>

        {/* Location & Contact */}
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              {facility.address ? `${facility.address}, ` : ""}
              {facility.city}, {facility.province}
            </span>
          </div>

          {facility.contact_number && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <a
                href={`tel:${facility.contact_number}`}
                className="font-medium text-emerald-700 hover:underline"
              >
                {facility.contact_number}
              </a>
            </div>
          )}
        </div>

        {/* Capacity Highlights (Beds & ICU) */}
        {(bedResource || icuResource) && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 text-xs">
            {bedResource && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <Bed className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px]">
                  Ward Beds:{" "}
                  <strong className="text-slate-900">
                    {bedResource.quantity ? `${bedResource.quantity}` : "Available"}
                  </strong>
                </span>
              </div>
            )}
            {icuResource && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <Ambulance className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px]">
                  ICU Beds:{" "}
                  <strong className="text-slate-900">
                    {icuResource.quantity ? `${icuResource.quantity}` : "Available"}
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Available Services Chips */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
            <span>Verified Capabilities:</span>
            <span className="text-[10px] text-slate-400">
              {availableServices.length} registered
            </span>
          </p>

          <div className="flex flex-wrap gap-1">
            {availableServices.length > 0 ? (
              availableServices.slice(0, 5).map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-100"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                  {r.resource_name}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">
                General outpatient primary services
              </span>
            )}

            {availableServices.length > 5 && (
              <button
                type="button"
                onClick={() => onViewDetails && onViewDetails(facility)}
                className="text-[10px] font-semibold text-emerald-700 hover:underline px-1 py-0.5"
              >
                +{availableServices.length - 5} more
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails && onViewDetails(facility)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span>Details</span>
        </button>

        <div className="flex items-center gap-1.5">
          {onRouteHere && facility.latitude && facility.longitude && (
            <button
              type="button"
              onClick={() => onRouteHere(facility)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
              title="Test routing to this facility in Smart Referral"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-600" />
              <span>Route Here</span>
            </button>
          )}

          <Link
            href={`/dashboard/referrals/create?facilityId=${facility.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-1.5 px-3 rounded-lg shadow-xs transition-colors"
          >
            <span>Refer Patient</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
