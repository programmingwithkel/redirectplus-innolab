import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ClipboardList,
  Inbox,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FilePlus,
  ArrowRight,
} from "lucide-react"
import { StatsCard } from "@/components/shared/stats-card"
import { StatusBadge, UrgencyBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FACILITY_THEMES } from "@/lib/constants/facility-themes"
import type { FacilityType } from "@/lib/constants/facility-themes"

export default async function DashboardPage() {
  const user = await getUser()
  if (!user || !user.facility) redirect("/login")

  const supabase = await createClient()
  const facilityId = user.facility_id!

  // Fetch stats
  const [
    { count: totalReferrals },
    { count: pendingCount },
    { count: inProgressCount },
    { count: completedCount },
    { data: incomingReferrals },
    { data: outgoingReferrals },
  ] = await Promise.all([
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .or(
        `referring_facility_id.eq.${facilityId},receiving_facility_id.eq.${facilityId}`
      ),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("receiving_facility_id", facilityId)
      .eq("status", "PENDING"),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .or(
        `referring_facility_id.eq.${facilityId},receiving_facility_id.eq.${facilityId}`
      )
      .in("status", ["ACCEPTED", "IN_PROGRESS"]),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .or(
        `referring_facility_id.eq.${facilityId},receiving_facility_id.eq.${facilityId}`
      )
      .eq("status", "COMPLETED"),
    supabase
      .from("referrals")
      .select(
        "id, patient_name, chief_complaint, urgency, status, created_at, referring_facility:facilities!referrals_referring_facility_id_fkey(name)"
      )
      .eq("receiving_facility_id", facilityId)
      .in("status", ["PENDING", "ACKNOWLEDGED", "ACCEPTED", "IN_PROGRESS"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("referrals")
      .select(
        "id, patient_name, chief_complaint, urgency, status, created_at, receiving_facility:facilities!referrals_receiving_facility_id_fkey(name)"
      )
      .eq("referring_facility_id", facilityId)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const facilityType = user.facility.facility_type as FacilityType
  const theme = FACILITY_THEMES[facilityType]

  return (
    <div className="space-y-6">
      {/* Welcome & facility identity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Dashboard
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: theme.light,
                color: theme.dark,
              }}
            >
              {theme.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {user.facility.name}
            </span>
          </div>
        </div>
        <Link href="/dashboard/referrals/create">
          <Button
            style={{ backgroundColor: "var(--facility-primary)" }}
            className="text-white hover:opacity-90"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Create Referral
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Referrals"
          value={totalReferrals ?? 0}
          icon={<ClipboardList className="h-4 w-4" />}
          accent
        />
        <StatsCard
          title="Pending Action"
          value={pendingCount ?? 0}
          icon={<Clock className="h-4 w-4" />}
          description="Awaiting acknowledgment"
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Active referrals"
        />
        <StatsCard
          title="Completed"
          value={completedCount ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          description="Successfully resolved"
        />
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Incoming Referrals */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">
                Incoming Referrals
              </h2>
            </div>
            <Link
              href="/dashboard/referrals/incoming"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          {incomingReferrals && incomingReferrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">From</TableHead>
                  <TableHead className="text-xs">Urgency</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingReferrals.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/referrals/${ref.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {ref.patient_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[200px]">
                        {ref.chief_complaint}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(ref.referring_facility as any)?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={ref.urgency} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ref.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No incoming referrals pending
            </div>
          )}
        </div>

        {/* Outgoing Referrals */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">
                Outgoing Referrals
              </h2>
            </div>
            <Link
              href="/dashboard/referrals/outgoing"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          {outgoingReferrals && outgoingReferrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">To</TableHead>
                  <TableHead className="text-xs">Urgency</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outgoingReferrals.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/referrals/${ref.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {ref.patient_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[200px]">
                        {ref.chief_complaint}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(ref.receiving_facility as any)?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={ref.urgency} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ref.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No outgoing referrals yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
