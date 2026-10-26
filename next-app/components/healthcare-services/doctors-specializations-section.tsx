"use client"

import { useMemo, useState } from "react"
import { Stethoscope, Search, Filter } from "lucide-react"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import { formatDistanceToNow } from "date-fns"
import type { DoctorSpecialist } from "@/lib/types/healthcare-services"

// ─── Status styling map (SRP: presentation logic) ────────────────────────────

const SPECIALIST_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  AVAILABLE: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "On Call",
  },
  LIMITED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Limited",
  },
  UNAVAILABLE: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Off Duty",
  },
  UNKNOWN: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "Unknown",
  },
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DoctorsSpecializationsSectionProps {
  doctors: DoctorSpecialist[]
}

export function DoctorsSpecializationsSection({
  doctors,
}: DoctorsSpecializationsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filtered = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.specialistLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.facilityName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || doc.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [doctors, searchQuery, statusFilter])

  // Group by specialist type for visual grouping
  const grouped = useMemo(() => {
    const map = new Map<string, DoctorSpecialist[]>()
    filtered.forEach((doc) => {
      const key = doc.specialistLabel
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(doc)
    })
    return map
  }, [filtered])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Doctors & Specializations
            </h2>
            <p className="text-xs text-muted-foreground">
              {doctors.length} specialist{doctors.length !== 1 ? "s" : ""}{" "}
              reported across all facilities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search specialist or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-lg border border-border bg-white pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-white px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">On Call</option>
            <option value="LIMITED">Limited</option>
            <option value="UNAVAILABLE">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Specialist cards grouped by type */}
      {grouped.size > 0 ? (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([label, items]) => (
            <div key={label}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                {label} ({items.length})
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((doc) => {
                  const style =
                    SPECIALIST_STATUS_STYLES[doc.status] ??
                    SPECIALIST_STATUS_STYLES.UNKNOWN
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bg}`}
                        >
                          <Stethoscope
                            className={`h-4 w-4 ${style.text}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <FacilityTypeBadge type={doc.facilityType} />
                            <span className="truncate text-xs font-medium text-foreground">
                              {doc.facilityName}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Updated{" "}
                            {formatDistanceToNow(new Date(doc.updatedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.bg} ${style.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${style.dot} ${
                            doc.status === "AVAILABLE" ? "animate-pulse" : ""
                          }`}
                        />
                        {style.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-slate-50/50 p-8 text-center">
          <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No specialists found matching your filters
          </p>
        </div>
      )}
    </section>
  )
}
