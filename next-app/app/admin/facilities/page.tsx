import { createClient } from "@/lib/supabase/server"
import { FacilityTypeBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, XCircle, MapPin } from "lucide-react"

export default async function AdminFacilitiesPage() {
  const supabase = await createClient()

  const { data: facilities } = await supabase
    .from("facilities")
    .select(`*, user_count:profiles(count)`)
    .order("facility_type")
    .order("name")

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        Facility Management
      </h1>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Facility</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Contact</TableHead>
              <TableHead className="text-xs">Users</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities?.map((f: any) => (
              <TableRow key={f.id}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">
                    {f.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.email || "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <FacilityTypeBadge type={f.facility_type} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {f.city}, {f.province}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {f.contact_number || "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {f.user_count?.[0]?.count ?? 0}
                </TableCell>
                <TableCell>
                  {f.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700">
                      <XCircle className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
