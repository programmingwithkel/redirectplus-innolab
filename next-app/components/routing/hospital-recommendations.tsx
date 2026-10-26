"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp, Info, ShieldAlert, Sparkles } from "lucide-react"
import type { RankedFacility, RankingResult } from "@/lib/routing/domain/types"
import { HospitalResultCard } from "./hospital-result-card"

export function HospitalRecommendations({
  ranking,
  runId,
  selectedHospitalId,
  onSelectHospital,
}: {
  ranking: RankingResult
  runId?: string | null
  selectedHospitalId?: string | null
  onSelectHospital: (hospital: RankedFacility) => void
}) {
  const [showExcluded, setShowExcluded] = useState(false)

  const { outcome, recommended, alternatives, unverified, excluded, nearerExcluded } =
    ranking

  if (outcome === "NONE") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Capable Facilities Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No registered facility within the search radius satisfied the mandatory clinical
          capabilities or operational requirements. Expand search radius or contact emergency services.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fallback warning if live travel time was approximate */}
      {recommended?.travel.source === "APPROX_FALLBACK" && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Note:</strong> Live Google Routes driving time was temporarily unavailable.
            Facilities are ranked by verified clinical capability and approximate distance.
          </span>
        </div>
      )}

      {/* Nearer Hospital Excluded Explanation Banner */}
      {nearerExcluded.length > 0 && recommended && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50/90 p-3.5 text-xs text-amber-950 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Why a closer hospital was not selected:</span>
          </div>
          <div className="space-y-1 pl-5">
            {nearerExcluded.map((ex) => (
              <p key={ex.facility.id} className="text-[11px] leading-relaxed">
                <strong>{ex.facility.name}</strong> ({ex.travel.durationSeconds ? `${Math.round(ex.travel.durationSeconds / 60)} min` : "closer"}) —{" "}
                <span className="text-amber-900 underline decoration-amber-400">
                  {ex.primaryIssue?.message || "Lacks required capability or acceptance"}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* RECOMMENDED HOSPITAL (Primary Result) */}
      {recommended ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Primary Recommendation
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Closest confirmed accepting facility
            </span>
          </div>

          <HospitalResultCard
            hospital={recommended}
            isRecommended
            isSelected={selectedHospitalId === recommended.facility.id}
            onSelect={() => onSelectHospital(recommended)}
            runId={runId}
          />
        </div>
      ) : outcome === "UNVERIFIED_ONLY" ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            No Facility Has Confirmed Acceptance On Record
          </p>
          <p className="text-[11px]">
            The following facilities possess the required clinical services, but their immediate
            bed or specialist acceptance is unverified. Call before dispatching transport.
          </p>
        </div>
      ) : null}

      {/* ALTERNATIVES SECTION */}
      {alternatives.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Other Suitable Hospitals ({alternatives.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Ranked by travel time and verified acceptance
            </span>
          </div>

          <div className="space-y-3">
            {alternatives.map((alt) => (
              <HospitalResultCard
                key={alt.facility.id}
                hospital={alt}
                isSelected={selectedHospitalId === alt.facility.id}
                onSelect={() => onSelectHospital(alt)}
                runId={runId}
              />
            ))}
          </div>
        </div>
      )}

      {/* UNVERIFIED CANDIDATES SECTION */}
      {unverified.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Capable Facilities with Unverified Availability ({unverified.length})
            </h3>
          </div>

          <div className="space-y-3">
            {unverified.map((unv) => (
              <HospitalResultCard
                key={unv.facility.id}
                hospital={unv}
                isSelected={selectedHospitalId === unv.facility.id}
                onSelect={() => onSelectHospital(unv)}
                runId={runId}
              />
            ))}
          </div>
        </div>
      )}

      {/* EXCLUDED FACILITIES SECTION (Collapsible) */}
      {excluded.length > 0 && (
        <div className="rounded-lg border border-border bg-slate-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <span>Excluded Facilities & Clinical Reasons ({excluded.length})</span>
            {showExcluded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showExcluded && (
            <div className="p-4 pt-1 space-y-3 border-t border-border">
              {excluded.map((ex) => (
                <HospitalResultCard
                  key={ex.facility.id}
                  hospital={ex}
                  isSelected={selectedHospitalId === ex.facility.id}
                  onSelect={() => onSelectHospital(ex)}
                  runId={runId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
