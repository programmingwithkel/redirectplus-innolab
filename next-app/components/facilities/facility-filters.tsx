"use client"

import { Search, X, LayoutGrid, ListFilter, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { FacilityFilterState, FacilityViewMode, FacilitySortOption } from "./facility-types"

const TIER_OPTIONS = [
  { label: "All Facilities", value: "ALL" },
  { label: "Hospitals", value: "HOSPITALS" },
  { label: "Tertiary", value: "TERTIARY" },
  { label: "Secondary", value: "SECONDARY" },
  { label: "RHU", value: "RHU" },
  { label: "BHS", value: "BHS" },
]

const SERVICE_TAGS = [
  { label: "All Capabilities", value: "ALL" },
  { label: "Emergency 24/7", value: "EMERGENCY" },
  { label: "Operating Room / Surgery", value: "SURGERY" },
  { label: "ICU Beds", value: "ICU" },
  { label: "Maternal & OB", value: "MATERNAL" },
  { label: "CT / X-Ray", value: "DIAGNOSTICS" },
]

export function FacilityFilters({
  filters,
  onChange,
  totalResults,
}: {
  filters: FacilityFilterState
  onChange: (updated: Partial<FacilityFilterState>) => void
  totalResults: number
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs">
      {/* Top Bar: Search, Sort, View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by facility name, municipality, province, or service..."
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            className="pl-9 pr-8 h-9 text-xs bg-slate-50/50 border-border focus-visible:bg-white"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onChange({ query: "" })}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as FacilitySortOption })}
              className="h-9 rounded-md border border-border bg-slate-50/50 px-2.5 text-xs text-foreground focus:bg-white focus:outline-hidden"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="tier">Sort by Level / Tier</option>
              <option value="municipality">Sort by Municipality</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => onChange({ viewMode: "grid" })}
              className={`rounded-md p-1.5 transition-all ${
                filters.viewMode === "grid"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ viewMode: "list" })}
              className={`rounded-md p-1.5 transition-all ${
                filters.viewMode === "list"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <ListFilter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row 1: Facility Tier Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Tier:
        </span>
        {TIER_OPTIONS.map((opt) => {
          const isActive = filters.tier === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ tier: opt.value })}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          )
        })}

        <div className="ml-auto text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{totalResults}</span> facilities
        </div>
      </div>

      {/* Filter Row 2: Service / Capability Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Capability:
        </span>
        {SERVICE_TAGS.map((tag) => {
          const isActive = filters.serviceTag === tag.value
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => onChange({ serviceTag: tag.value })}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
                  : "bg-white text-muted-foreground border border-border hover:bg-slate-50"
              }`}
            >
              {tag.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
