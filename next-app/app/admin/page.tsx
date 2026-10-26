import { StatsCard } from "@/components/shared/stats-card"
import { StatusBadge, UrgencyBadge, FacilityTypeBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building2,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  fetchAdminOverviewStats,
  fetchReferralsByStatus,
  fetchReferralsByUrgency,
  fetchReferralsByFacilityType,
  fetchMonthlyReferralTrends,
  fetchRecentReferrals,
} from "@/lib/queries/admin-stats"
import {
  ReferralStatusChart,
  UrgencyDistributionChart,
  FacilityTypeChart,
  MonthlyTrendsChart,
} from "@/components/admin/charts"

export default async function AdminOverviewPage() {
  const [
    stats,
    statusData,
    urgencyData,
    facilityTypeData,
    monthlyTrends,
    recentReferrals,
  ] = await Promise.all([
    fetchAdminOverviewStats(),
    fetchReferralsByStatus(),
    fetchReferralsByUrgency(),
    fetchReferralsByFacilityType(),
    fetchMonthlyReferralTrends(),
    fetchRecentReferrals(10),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          System Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor all referrals, facilities, and system activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Facilities"
          value={stats.facilityCount}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Users"
          value={stats.userCount}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Referrals"
          value={stats.totalReferrals}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatsCard
          title="Active"
          value={stats.activeReferrals}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Completed"
          value={stats.completedReferrals}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Emergency Active"
          value={stats.emergencyReferrals}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row 1: Monthly Trends + Status Distribution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Referral Trends"
          subtitle="Last 6 months"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        >
          <MonthlyTrendsChart data={monthlyTrends} />
        </ChartCard>

        <ChartCard
          title="Referrals by Facility Type"
          subtitle="Incoming vs Outgoing volume"
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        >
          <FacilityTypeChart data={facilityTypeData} />
        </ChartCard>
      </div>

      {/* Charts Row 2: Urgency + Status Pie Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartCard
          title="Status Distribution"
          subtitle="Current referral statuses"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        >
          <ReferralStatusChart data={statusData} />
        </ChartCard>

        <ChartCard
          title="Urgency Distribution"
          subtitle="Referral urgency breakdown"
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        >
          <UrgencyDistributionChart data={urgencyData} />
        </ChartCard>
      </div>

      {/* Recent Referrals Table */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">
            All Recent Referrals
          </h2>
        </div>
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
            {recentReferrals.map((ref: any) => (
              <TableRow key={ref.id}>
                <TableCell className="text-sm font-medium">
                  {ref.patient_name}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FacilityTypeBadge
                      type={(ref.referring_facility as any)?.facility_type}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(ref.referring_facility as any)?.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FacilityTypeBadge
                      type={(ref.receiving_facility as any)?.facility_type}
                    />
                    <span className="text-xs text-muted-foreground">
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
                <TableCell className="text-xs text-muted-foreground">
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

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <div>
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
