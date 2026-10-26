import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatsCard } from "@/components/shared/stats-card"
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
} from "lucide-react"

// ─── Status Color Map ────────────────────────────────────────────────────────

const RESOURCE_STATUS_STYLES: Record<
  string,
  { className: string; label: string }
> = {
  AVAILABLE: {
    className: "text-green-700 bg-green-50",
    label: "Available",
  },
  LIMITED: {
    className: "text-yellow-700 bg-yellow-50",
    label: "Limited",
  },
  UNAVAILABLE: {
    className: "text-red-700 bg-red-50",
    label: "Unavailable",
  },
  UNKNOWN: {
    className: "text-gray-700 bg-gray-50",
    label: "Unknown",
  },
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function AdminResourcesPage() {
  const supabase = await createClient()

  // Fetch all resources with their parent facility
  const { data: resources } = await supabase
    .from("facility_resources")
    .select(
      `*, facility:facilities(name, facility_type)`
    )
    .order("resource_category")
    .order("resource_name")

  // Compute aggregate stats
  const totalResources = resources?.length ?? 0
  const availableCount =
    resources?.filter((r) => r.status === "AVAILABLE").length ?? 0
  const limitedCount =
    resources?.filter((r) => r.status === "LIMITED").length ?? 0
  const unavailableCount =
    resources?.filter((r) => r.status === "UNAVAILABLE").length ?? 0

  // Get unique facility count that have resources
  const facilitiesWithResources = new Set(
    resources?.map((r) => r.facility_id) ?? []
  ).size

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Resources Overview"
        description="Monitor all facility resources, equipment, and availability across the network"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Resources"
          value={totalResources}
          icon={<Package className="h-4 w-4" />}
        />
        <StatsCard
          title="Available"
          value={availableCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Limited"
          value={limitedCount}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatsCard
          title="Unavailable"
          value={unavailableCount}
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="Facilities w/ Resources"
          value={facilitiesWithResources}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      {/* Resources Table */}
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Resource Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Facility</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Quantity</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources?.map((resource: any) => {
              const statusStyle =
                RESOURCE_STATUS_STYLES[resource.status] ??
                RESOURCE_STATUS_STYLES.UNKNOWN
              return (
                <TableRow key={resource.id}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">
                      {resource.resource_name}
                    </p>
                    {resource.description && (
                      <p className="mt-0.5 max-w-[250px] truncate text-xs text-muted-foreground">
                        {resource.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {resource.resource_category || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FacilityTypeBadge
                        type={(resource.facility as any)?.facility_type}
                      />
                      <span className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {(resource.facility as any)?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {resource.resource_type || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {resource.quantity ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!resources || resources.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No resources found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
