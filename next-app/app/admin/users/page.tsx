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
import { Shield, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select(`*, facility:facilities(name, facility_type)`)
    .order("role")
    .order("full_name")

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        User Management
      </h1>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">Facility</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">
                    {u.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </TableCell>
                <TableCell>
                  {u.role === "super_admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Operational
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {u.facility ? (
                    <div className="flex items-center gap-1">
                      <FacilityTypeBadge type={(u.facility as any).facility_type} />
                      <span className="text-xs text-muted-foreground">
                        {(u.facility as any).name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No facility
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700">
                      <XCircle className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(u.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
