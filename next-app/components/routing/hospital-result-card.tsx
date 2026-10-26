"use client"

import Link from "next/link"
import {
  Building2,
  Clock,
  Compass,
  ExternalLink,
  MapPin,
  Navigation2,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import type { RankedFacility } from "@/lib/routing/domain/types"
import { AvailabilityBadge } from "./availability-badge"

export function HospitalResultCard({
  hospital,
  isRecommended = false,
  isSelected = false,
  onSelect,
  runId,
}: {
  hospital: RankedFacility
  isRecommended?: boolean
  isSelected?: boolean
  onSelect?: () => void
  runId?: string | null
}) {
  const { facility, travel, verdict, evidence, primaryIssue, oldestEvidenceAt } =
    hospital

  // Travel time display
  const durationMinutes =
    travel.durationSeconds !== null
      ? Math.round(travel.durationSeconds / 60)
      : null

  const distanceKm =
    travel.distanceMeters !== null
      ? (travel.distanceMeters / 1000).toFixed(1)
      : hospital.straightLineMeters !== null
      ? (hospital.straightLineMeters / 1000).toFixed(1)
      : null

  const googleMapsUrl = facility.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${facility.location.lat},${facility.location.lng}`
    : null

  const createReferralUrl = `/dashboard/referrals/create?facilityId=${facility.id}${
    runId ? `&runId=${runId}` : ""
  }`

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border transition-all cursor-pointer ${
        isRecommended
          ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-md"
          : isSelected
          ? "border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-md"
          : "border-border bg-white hover:border-slate-300 hover:shadow-sm"
      } p-5 space-y-4`}
    >
      {/* Top Tag & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isRecommended && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              ★ Recommended
            </span>
          )}
          <FacilityTypeBadge type={facility.tier} />
          {facility.isSampleData && (
            <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[10px] font-medium">
              Demo Sample
            </span>
          )}
        </div>

        <AvailabilityBadge
          state={verdict === "EXCLUDED" ? "EXCLUDED" : verdict}
          lastUpdated={oldestEvidenceAt}
        />
      </div>

      {/* Hospital Name & ETA Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
            {facility.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {facility.address ? `${facility.address}, ` : ""}
            {facility.municipality}, {facility.province}
          </p>
        </div>

        {/* Big ETA Callout */}
        <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 text-right shrink-0">
          <div className="flex items-center justify-end gap-1.5 text-emerald-900">
            <Navigation2 className="h-4 w-4 text-emerald-700" />
            <span className="text-lg font-extrabold tracking-tight">
              {durationMinutes !== null ? `${durationMinutes} min` : "ETA N/A"}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700">
            {distanceKm ? `${distanceKm} km` : ""}{" "}
            {travel.source === "APPROX_FALLBACK" && (
              <span className="italic text-[10px] text-amber-700">(approx. distance)</span>
            )}
          </p>
        </div>
      </div>

      {/* Match Evidence (Why it matches) */}
      {verdict === "CONFIRMED" && evidence.length > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-900">Why this facility matches:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
            {evidence.slice(0, 6).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exclusion Explanation (if excluded) */}
      {verdict === "EXCLUDED" && primaryIssue && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 space-y-1">
          <p className="font-semibold flex items-center gap-1 text-red-800">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            Reason Not Recommended:
          </p>
          <p className="text-[11px] text-red-800 leading-relaxed">{primaryIssue.message}</p>
        </div>
      )}

      {/* Unverified note */}
      {verdict === "UNVERIFIED" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 space-y-1">
          <p className="font-semibold text-amber-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Unconfirmed Acceptance / Availability
          </p>
          <p>
            This facility has suitable medical services on record, but critical availability
            or acceptance has not been confirmed recently. Contact facility staff prior to transfer.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          {facility.phone && (
            <a
              href={`tel:${facility.phone}`}
              className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-emerald-700 border border-border rounded-md px-2.5 py-1.5 bg-white"
            >
              <Phone className="h-3 w-3" />
              <span>{facility.phone}</span>
            </a>
          )}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-blue-700 border border-border rounded-md px-2.5 py-1.5 bg-white"
            >
              <Compass className="h-3 w-3" />
              <span>Get Directions</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {verdict !== "EXCLUDED" && (
          <Link href={createReferralUrl}>
            <Button
              size="sm"
              className={`h-8 text-xs font-semibold gap-1.5 ${
                isRecommended
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              <span>Refer Patient Here</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
