"use client"

import { useMemo, useState } from "react"
import { Bed, Search } from "lucide-react"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import type { BedRoom } from "@/lib/types/healthcare-services"

// ─── Status styling map (SRP) ────────────────────────────────────────────────

const BED_STATUS_STYLES: Record<
  string,
  { className: string; label: string }
> = {
  AVAILABLE: {
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    label: "Available",
  },
  LIMITED: {
    className: "text-amber-700 bg-amber-50 border-amber-200",
    label: "Limited",
  },
  UNAVAILABLE: {
    className: "text-red-700 bg-red-50 border-red-200",
    label: "Unavailable",
  },
  UNKNOWN: {
    className: "text-gray-600 bg-gray-50 border-gray-200",
    label: "Unknown",
  },
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface BedsRoomsSectionProps {
  beds: BedRoom[]
}

export function BedsRoomsSection({ beds }: BedsRoomsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filtered = useMemo(() => {
    return beds.filter((bed) => {
      const matchesSearch =
        !searchQuery ||
        bed.bedLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.facilityName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || bed.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [beds, searchQuery, statusFilter])

  // Summary by type
  const bedSummary = useMemo(() => {
    const map = new Map<string, { total: number; available: number }>()
    beds.forEach((b) => {
      const current = map.get(b.bedLabel) ?? { total: 0, available: 0 }
      current.total += b.quantity ?? 0
      if (b.status === "AVAILABLE") current.available += b.quantity ?? 0
      map.set(b.bedLabel, current)
    })
    return map
  }, [beds])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Bed className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Rooms & Beds
            </h2>
            <p className="text-xs text-muted-foreground">
              {beds.length} bed/room record{beds.length !== 1 ? "s" : ""}{" "}
              across all facilities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bed type or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-lg border border-border bg-white pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-white px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="LIMITED">Limited</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Quick summary chips */}
      {bedSummary.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(bedSummary.entries()).map(([label, counts]) => (
            <div
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs shadow-sm"
            >
              <Bed className="h-3 w-3 text-sky-600" />
              <span className="font-medium text-foreground">{label}</span>
              <span className="text-muted-foreground">
                {counts.available}/{counts.total}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Beds table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Bed / Room Type</TableHead>
              <TableHead className="text-xs">Facility</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs text-right">Quantity</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((bed) => {
              const style =
                BED_STATUS_STYLES[bed.status] ?? BED_STATUS_STYLES.UNKNOWN
              return (
                <TableRow key={bed.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bed className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {bed.bedLabel}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <FacilityTypeBadge type={bed.facilityType} />
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {bed.facilityName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {bed.resourceTypeCode.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {bed.quantity ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(bed.updatedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No beds or rooms found matching your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
