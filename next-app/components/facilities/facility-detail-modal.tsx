"use client"

import Link from "next/link"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  Bed,
  Ambulance,
  ExternalLink,
  X,
  Stethoscope,
} from "lucide-react"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import type { DirectoryFacility } from "./facility-types"

export function FacilityDetailModal({
  facility,
  isOpen,
  onClose,
  onRouteHere,
}: {
  facility: DirectoryFacility | null
  isOpen: boolean
  onClose: () => void
  onRouteHere?: (facility: DirectoryFacility) => void
}) {
  if (!isOpen || !facility) return null

  const isOperational =
    !facility.operating_status ||
    facility.operating_status === "OPERATIONAL"

  const googleMapsUrl =
    facility.latitude && facility.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`
      : null

  const availableResources = (facility.resources || []).filter(
    (r) => r.status === "AVAILABLE"
  )
  const limitedResources = (facility.resources || []).filter(
    (r) => r.status === "LIMITED"
  )
  const unavailableResources = (facility.resources || []).filter(
    (r) => r.status === "UNAVAILABLE"
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-border">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <FacilityTypeBadge type={facility.facility_type} />
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isOperational
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOperational ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                }`}
              />
              {isOperational ? "Operational" : facility.operating_status}
            </span>
            {facility.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                DOH Accredited
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900">{facility.name}</h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1 text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                {facility.address ? `${facility.address}, ` : ""}
                {facility.city}, {facility.province}
              </span>
            </div>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Contact Strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Emergency Hotline</p>
              {facility.contact_number ? (
                <a
                  href={`tel:${facility.contact_number}`}
                  className="font-bold text-slate-900 hover:text-emerald-700 hover:underline"
                >
                  {facility.contact_number}
                </a>
              ) : (
                <span className="text-muted-foreground italic">Not provided</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Official Email</p>
              {facility.email ? (
                <a
                  href={`mailto:${facility.email}`}
                  className="font-medium text-slate-900 hover:text-blue-700 hover:underline truncate"
                >
                  {facility.email}
                </a>
              ) : (
                <span className="text-muted-foreground italic">doh.bicol@careroute.ph</span>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Capabilities Section */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Verified Available Resources & Services ({availableResources.length})
            </h3>

            {availableResources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{r.resource_name}</span>
                    {r.quantity != null && (
                      <span className="rounded-md bg-emerald-200/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                        Qty: {r.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Standard primary health care and outpatient consultations.
              </p>
            )}
          </div>

          {/* Limited Resources if any */}
          {limitedResources.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Limited Capacity ({limitedResources.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {limitedResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-950"
                  >
                    <span className="font-semibold">{r.resource_name}</span>
                    <span className="text-[10px] text-amber-800">
                      {r.description || `Limited (${r.quantity || "High Occupancy"})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unavailable Resources if any */}
          {unavailableResources.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
                Currently Unavailable / Diversion ({unavailableResources.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unavailableResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-950"
                  >
                    <span className="font-semibold line-through">{r.resource_name}</span>
                    <span className="text-[10px] text-red-700">
                      {r.description || "Under Maintenance / Diverting"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2">
            {onRouteHere && facility.latitude && facility.longitude && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onRouteHere(facility)
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <Compass className="h-4 w-4" />
                <span>Smart Route Here</span>
              </button>
            )}

            <Link
              href={`/dashboard/referrals/create?facilityId=${facility.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <span>Refer Patient Here</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
