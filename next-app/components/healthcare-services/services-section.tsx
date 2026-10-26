"use client"

import { useMemo, useState } from "react"
import { Activity, Search, ShieldCheck, CheckCircle2 } from "lucide-react"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import type { FacilityServiceEntry } from "@/lib/types/healthcare-services"

// ─── Capability level styling (SRP) ─────────────────────────────────────────

const CAPABILITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  BASIC: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: "Basic",
  },
  STANDARD: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Standard",
  },
  ADVANCED: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    label: "Advanced",
  },
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ServicesSectionProps {
  services: FacilityServiceEntry[]
}

export function ServicesSection({ services }: ServicesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [capabilityFilter, setCapabilityFilter] = useState("ALL")

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      const matchesSearch =
        !searchQuery ||
        svc.serviceLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.facilityName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCapability =
        capabilityFilter === "ALL" ||
        svc.capabilityLevel === capabilityFilter

      return matchesSearch && matchesCapability
    })
  }, [services, searchQuery, capabilityFilter])

  // Group by service for visual grouping
  const grouped = useMemo(() => {
    const map = new Map<string, FacilityServiceEntry[]>()
    filtered.forEach((svc) => {
      const key = svc.serviceLabel
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(svc)
    })
    return map
  }, [filtered])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Healthcare Services
            </h2>
            <p className="text-xs text-muted-foreground">
              {services.length} active service{services.length !== 1 ? "s" : ""}{" "}
              across all facilities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search service or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-lg border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
            />
          </div>
          <select
            value={capabilityFilter}
            onChange={(e) => setCapabilityFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          >
            <option value="ALL">All Levels</option>
            <option value="BASIC">Basic</option>
            <option value="STANDARD">Standard</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Service cards grouped by service type */}
      {grouped.size > 0 ? (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([label, items]) => (
            <div key={label}>
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </h3>
                <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
                  {items.length} facilit{items.length !== 1 ? "ies" : "y"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((svc) => {
                  const capStyle =
                    CAPABILITY_STYLES[svc.capabilityLevel] ??
                    CAPABILITY_STYLES.BASIC
                  return (
                    <div
                      key={svc.id}
                      className="group rounded-xl border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <FacilityTypeBadge type={svc.facilityType} />
                            <span className="truncate text-xs font-medium text-foreground">
                              {svc.facilityName}
                            </span>
                          </div>
                          {svc.serviceDescription && (
                            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                              {svc.serviceDescription}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${capStyle.bg} ${capStyle.text}`}
                        >
                          {capStyle.label}
                        </span>
                      </div>

                      {svc.lastVerifiedAt && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ShieldCheck className="h-3 w-3 text-teal-500" />
                          <span>
                            Verified{" "}
                            {new Date(svc.lastVerifiedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-slate-50/50 p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No services found matching your filters
          </p>
        </div>
      )}
    </section>
  )
}
