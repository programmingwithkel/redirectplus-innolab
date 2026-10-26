"use client"

import { useMemo } from "react"
import { Building2, Hospital, Stethoscope, HeartPulse, Activity } from "lucide-react"
import type { DirectoryFacility } from "./facility-types"

export function FacilityStatsHeader({ facilities }: { facilities: DirectoryFacility[] }) {
  const stats = useMemo(() => {
    const total = facilities.length
    const tertiary = facilities.filter((f) => f.facility_type === "TERTIARY").length
    const secondary = facilities.filter((f) => f.facility_type === "SECONDARY").length
    const hospitals = tertiary + secondary
    const rhus = facilities.filter((f) => f.facility_type === "RHU").length
    const bhs = facilities.filter((f) => f.facility_type === "BHS").length

    const operational = facilities.filter((f) => {
      const st = f.operating_status?.toUpperCase()
      return !st || st === "OPERATIONAL"
    }).length

    let totalBeds = 0
    facilities.forEach((f) => {
      ;(f.resources || []).forEach((r) => {
        const name = (r.resource_name || "").toLowerCase()
        if (name.includes("bed") && typeof r.quantity === "number") {
          totalBeds += r.quantity
        }
      })
    })

    return {
      total,
      hospitals,
      rhus,
      bhs,
      operationalRate: total > 0 ? Math.round((operational / total) * 100) : 100,
      totalBeds,
    }
  }, [facilities])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total Facilities */}
      <div className="rounded-xl border border-border bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Facilities
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{stats.total}</span>
          <span className="text-[11px] text-muted-foreground">Albay network</span>
        </div>
      </div>

      {/* Hospitals (Referral Centers) */}
      <div className="rounded-xl border border-border bg-white p-3.5 shadow-xs transition-all hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hospitals
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Hospital className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-emerald-950">{stats.hospitals}</span>
          <span className="text-[11px] text-emerald-700 font-medium">Apex & District</span>
        </div>
      </div>

      {/* RHU */}
      <div className="rounded-xl border border-border bg-white p-3.5 shadow-xs transition-all hover:border-blue-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Rural Health Units
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Stethoscope className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-blue-950">{stats.rhus}</span>
          <span className="text-[11px] text-blue-700 font-medium">Municipal RHU</span>
        </div>
      </div>

      {/* BHS */}
      <div className="rounded-xl border border-border bg-white p-3.5 shadow-xs transition-all hover:border-teal-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Barangay Stations
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <HeartPulse className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-teal-950">{stats.bhs}</span>
          <span className="text-[11px] text-teal-700 font-medium">Primary care</span>
        </div>
      </div>

      {/* Operational Rate */}
      <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-white p-3.5 shadow-xs transition-all hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operational
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-emerald-900">{stats.operationalRate}%</span>
          <span className="text-[11px] text-emerald-700 font-medium">Live readiness</span>
        </div>
      </div>
    </div>
  )
}
