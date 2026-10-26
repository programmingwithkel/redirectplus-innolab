import { createClient } from "@/lib/supabase/server"
import type { ReferralStatus, UrgencyLevel, FacilityType } from "@/lib/types/database"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminOverviewStats {
  facilityCount: number
  userCount: number
  totalReferrals: number
  activeReferrals: number
  completedReferrals: number
  emergencyReferrals: number
}

export interface ReferralsByStatus {
  status: ReferralStatus
  count: number
}

export interface ReferralsByUrgency {
  urgency: UrgencyLevel
  count: number
}

export interface ReferralsByFacilityType {
  facilityType: FacilityType
  label: string
  incoming: number
  outgoing: number
}

export interface MonthlyReferralTrend {
  month: string
  count: number
}

export interface RecentReferral {
  id: string
  patient_name: string
  chief_complaint: string
  urgency: UrgencyLevel
  status: ReferralStatus
  required_service: string | null
  created_at: string
  referring_facility: { name: string; facility_type: FacilityType } | null
  receiving_facility: { name: string; facility_type: FacilityType } | null
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function fetchAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createClient()

  const [
    { count: facilityCount },
    { count: userCount },
    { count: totalReferrals },
    { count: activeReferrals },
    { count: completedReferrals },
    { count: emergencyReferrals },
  ] = await Promise.all([
    supabase.from("facilities").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .in("status", ["PENDING", "ACKNOWLEDGED", "ACCEPTED", "IN_PROGRESS"]),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("status", "COMPLETED"),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("urgency", "EMERGENCY")
      .in("status", ["PENDING", "ACKNOWLEDGED", "ACCEPTED", "IN_PROGRESS"]),
  ])

  return {
    facilityCount: facilityCount ?? 0,
    userCount: userCount ?? 0,
    totalReferrals: totalReferrals ?? 0,
    activeReferrals: activeReferrals ?? 0,
    completedReferrals: completedReferrals ?? 0,
    emergencyReferrals: emergencyReferrals ?? 0,
  }
}

export async function fetchReferralsByStatus(): Promise<ReferralsByStatus[]> {
  const supabase = await createClient()

  const statuses: ReferralStatus[] = [
    "PENDING",
    "ACKNOWLEDGED",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "DECLINED",
    "REDIRECTED",
    "CANCELLED",
  ]

  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("status", status)
      return { status, count: count ?? 0 }
    })
  )

  return results.filter((r) => r.count > 0)
}

export async function fetchReferralsByUrgency(): Promise<ReferralsByUrgency[]> {
  const supabase = await createClient()

  const urgencies: UrgencyLevel[] = ["ROUTINE", "URGENT", "EMERGENCY"]

  const results = await Promise.all(
    urgencies.map(async (urgency) => {
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("urgency", urgency)
      return { urgency, count: count ?? 0 }
    })
  )

  return results
}

export async function fetchReferralsByFacilityType(): Promise<
  ReferralsByFacilityType[]
> {
  const supabase = await createClient()

  const facilityTypes: { type: FacilityType; label: string }[] = [
    { type: "BHS", label: "BHS" },
    { type: "RHU", label: "RHU" },
    { type: "SECONDARY", label: "Secondary" },
    { type: "TERTIARY", label: "Tertiary" },
  ]

  const results = await Promise.all(
    facilityTypes.map(async ({ type, label }) => {
      // Get facility IDs of this type
      const { data: facilities } = await supabase
        .from("facilities")
        .select("id")
        .eq("facility_type", type)

      const facilityIds = facilities?.map((f) => f.id) ?? []

      if (facilityIds.length === 0) {
        return { facilityType: type, label, incoming: 0, outgoing: 0 }
      }

      const [{ count: incoming }, { count: outgoing }] = await Promise.all([
        supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .in("receiving_facility_id", facilityIds),
        supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .in("referring_facility_id", facilityIds),
      ])

      return {
        facilityType: type,
        label,
        incoming: incoming ?? 0,
        outgoing: outgoing ?? 0,
      }
    })
  )

  return results
}

export async function fetchMonthlyReferralTrends(): Promise<
  MonthlyReferralTrend[]
> {
  const supabase = await createClient()

  // Get referrals from the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: referrals } = await supabase
    .from("referrals")
    .select("created_at")
    .gte("created_at", sixMonthsAgo.toISOString())
    .order("created_at")

  // Group by month
  const monthCounts = new Map<string, number>()

  // Initialize all months
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const key = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
    monthCounts.set(key, 0)
  }

  referrals?.forEach((ref) => {
    const date = new Date(ref.created_at)
    const key = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1)
  })

  return Array.from(monthCounts.entries()).map(([month, count]) => ({
    month,
    count,
  }))
}

export async function fetchRecentReferrals(
  limit = 10
): Promise<RecentReferral[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("referrals")
    .select(
      `*, referring_facility:facilities!referrals_referring_facility_id_fkey(name, facility_type),
      receiving_facility:facilities!referrals_receiving_facility_id_fkey(name, facility_type)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data as RecentReferral[]) ?? []
}
