import { createClient } from "@/lib/supabase/server"
import { StatusBadge, UrgencyBadge, FacilityTypeBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"

export default async function AdminReferralsPage() {
  const supabase = await createClient()

  const { data: referrals } = await supabase
    .from("referrals")
    .select(
      `*, referring_facility:facilities!referrals_referring_facility_id_fkey(name, facility_type),
      receiving_facility:facilities!referrals_receiving_facility_id_fkey(name, facility_type)`
    )
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        All Referrals
      </h1>

      <div className="rounded-lg border border-border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Patient</TableHead>
              <TableHead className="text-xs">From</TableHead>
              <TableHead className="text-xs">To</TableHead>
              <TableHead className="text-xs">Service</TableHead>
              <TableHead className="text-xs">Urgency</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals?.map((ref: any) => (
              <TableRow key={ref.id}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">
                    {ref.patient_name}
                  </p>
                  <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {ref.chief_complaint}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FacilityTypeBadge
                      type={(ref.referring_facility as any)?.facility_type}
                    />
                    <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {(ref.referring_facility as any)?.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FacilityTypeBadge
                      type={(ref.receiving_facility as any)?.facility_type}
                    />
                    <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {(ref.receiving_facility as any)?.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {ref.required_service || "—"}
                </TableCell>
                <TableCell>
                  <UrgencyBadge urgency={ref.urgency} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={ref.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(ref.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
