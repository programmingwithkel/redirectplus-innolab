import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, UrgencyBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"

export default async function OutgoingReferralsPage() {
  const user = await getUser()
  if (!user || !user.facility_id) redirect("/login")

  const supabase = await createClient()

  const { data: referrals } = await supabase
    .from("referrals")
    .select(
      `*, receiving_facility:facilities!referrals_receiving_facility_id_fkey(name, facility_type)`
    )
    .eq("referring_facility_id", user.facility_id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <PageHeader
        title="Outgoing Referrals"
        description="Referrals created by your facility"
        action={
          <Link href="/dashboard/referrals/create">
            <Button
              style={{ backgroundColor: "var(--facility-primary)" }}
              className="text-white hover:opacity-90"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              New Referral
            </Button>
          </Link>
        }
      />

      <div className="rounded-lg border border-border bg-white shadow-sm">
        {referrals && referrals.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">To</TableHead>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs">Urgency</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Created</TableHead>
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
                    {(ref.receiving_facility as any)?.name}
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
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No outgoing referrals yet
            </p>
            <Link href="/dashboard/referrals/create">
              <Button variant="outline" size="sm" className="mt-3">
                <FilePlus className="mr-2 h-4 w-4" />
                Create your first referral
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
