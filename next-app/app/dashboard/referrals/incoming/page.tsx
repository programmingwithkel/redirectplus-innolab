import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, UrgencyBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"

export default async function IncomingReferralsPage() {
  const user = await getUser()
  if (!user || !user.facility_id) redirect("/login")

  const supabase = await createClient()

  const { data: referrals } = await supabase
    .from("referrals")
    .select(
      `*, referring_facility:facilities!referrals_referring_facility_id_fkey(name, facility_type)`
    )
    .eq("receiving_facility_id", user.facility_id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <PageHeader
        title="Incoming Referrals"
        description="Referrals addressed to your facility"
      />

      <div className="rounded-lg border border-border bg-white shadow-sm">
        {referrals && referrals.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs">Urgency</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((ref: any) => (
                <TableRow key={ref.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <Link
                      href={`/dashboard/referrals/${ref.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {ref.patient_name}
                    </Link>
                    <p className="mt-0.5 max-w-[250px] truncate text-xs text-muted-foreground">
                      {ref.chief_complaint}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(ref.referring_facility as any)?.name}
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
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(ref.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No incoming referrals
          </div>
        )}
      </div>
    </div>
  )
}
