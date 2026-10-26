"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  updateResourceAction,
  deleteResourceAction,
} from "@/lib/actions/resource-actions"
import type { FacilityResource, ResourceStatus } from "@/lib/types/database"

const STATUS_CONFIG: Record<
  ResourceStatus,
  { icon: typeof CheckCircle2; color: string; bg: string; label: string }
> = {
  AVAILABLE: {
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50",
    label: "Available",
  },
  LIMITED: {
    icon: AlertTriangle,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    label: "Limited",
  },
  UNAVAILABLE: {
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    label: "Unavailable",
  },
  UNKNOWN: {
    icon: HelpCircle,
    color: "text-gray-500",
    bg: "bg-gray-50",
    label: "Unknown",
  },
}

export function ResourceTable({ resources }: { resources: FacilityResource[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStatusChange(
    resourceId: string,
    newStatus: ResourceStatus
  ) {
    setLoading(resourceId)
    await updateResourceAction(resourceId, newStatus)
    setLoading(null)
    router.refresh()
  }

  async function handleDelete(resourceId: string) {
    if (!confirm("Delete this resource?")) return
    setLoading(resourceId)
    await deleteResourceAction(resourceId)
    setLoading(null)
    router.refresh()
  }

  // Group by category
  const categories = Array.from(
    new Set(resources.map((r) => r.resource_category || "other"))
  )

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryResources = resources.filter(
          (r) => (r.resource_category || "other") === category
        )
        return (
          <div
            key={category}
            className="rounded-lg border border-border bg-white shadow-sm"
          >
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium capitalize text-foreground">
                {category === "other" ? "Other" : category}
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Resource</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryResources.map((resource) => {
                  const config = STATUS_CONFIG[resource.status]
                  const StatusIcon = config.icon
                  const isLoading = loading === resource.id

                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">
                          {resource.resource_name}
                        </p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground">
                            {resource.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {resource.quantity ?? "—"}
                      </TableCell>
                      <TableCell>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={resource.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  resource.id,
                                  e.target.value as ResourceStatus
                                )
                              }
                              className="h-7 rounded border border-input bg-background px-2 text-xs"
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="LIMITED">Limited</option>
                              <option value="UNAVAILABLE">Unavailable</option>
                              <option value="UNKNOWN">Unknown</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(resource.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )
      })}

      {resources.length === 0 && (
        <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No resources configured. Add your first resource above.
        </div>
      )}
    </div>
  )
}
