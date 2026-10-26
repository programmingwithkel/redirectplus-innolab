import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  User,
  Building2,
  Clock,
  MapPin,
  FileText,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge, UrgencyBadge, FacilityTypeBadge } from "@/components/shared/status-badge"
import { ReferralActions } from "@/components/referrals/referral-actions"
import type { ReferralStatus } from "@/lib/constants/referral-status"

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser()
  if (!user || !user.facility_id) redirect("/login")

  const supabase = await createClient()

  // Fetch referral with facilities
  const { data: referral, error } = await supabase
    .from("referrals")
    .select(
      `*,
      referring_facility:facilities!referrals_referring_facility_id_fkey(*),
      receiving_facility:facilities!referrals_receiving_facility_id_fkey(*),
      created_by_profile:profiles!referrals_created_by_fkey(full_name, email)`
    )
    .eq("id", id)
    .single()

  if (error || !referral) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Referral not found</p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  // Fetch events timeline
  const { data: events } = await supabase
    .from("referral_events")
    .select(`*, actor:profiles!referral_events_actor_id_fkey(full_name)`)
    .eq("referral_id", id)
    .order("created_at", { ascending: true })

  // Fetch all facilities for redirect dialog
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .eq("is_active", true)

  const isReceiver = referral.receiving_facility_id === user.facility_id
  const isSender = referral.referring_facility_id === user.facility_id
  const refFacility = referral.referring_facility as any
  const recFacility = referral.receiving_facility as any

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Dashboard
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {referral.patient_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={referral.status as ReferralStatus} />
              <UrgencyBadge urgency={referral.urgency} />
              <span className="text-xs text-muted-foreground">
                ID: {referral.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <ReferralActions
        referralId={referral.id}
        status={referral.status as ReferralStatus}
        isReceiver={isReceiver}
        isSender={isSender}
        facilities={facilities ?? []}
        currentFacilityId={user.facility_id}
        referringFacilityId={referral.referring_facility_id}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Details */}
        <div className="space-y-4 lg:col-span-2">
          {/* Patient Info */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              Patient Information
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Name" value={referral.patient_name} />
              <InfoItem label="Age" value={referral.patient_age ? `${referral.patient_age} years old` : "—"} />
              <InfoItem label="Sex" value={referral.patient_sex || "—"} />
              <InfoItem label="Address" value={referral.patient_address || "—"} />
            </div>
          </div>

          {/* Referral Details */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Referral Details
            </h2>
            <div className="space-y-3 text-sm">
              <InfoItem label="Chief Complaint" value={referral.chief_complaint} />
              <InfoItem label="Reason" value={referral.reason || "—"} />
              <InfoItem label="Required Service" value={referral.required_service || "—"} />
              {referral.clinical_notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Clinical Notes</span>
                  <p className="mt-1 rounded-md bg-gray-50 p-3 text-xs leading-relaxed text-foreground">
                    {referral.clinical_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Referral Timeline
            </h2>
            {events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event: any, i: number) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                      {i < events.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.new_status || event.event_type} />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground">
                        {event.notes || event.event_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {(event.actor as any)?.full_name || "System"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No events recorded</p>
            )}
          </div>
        </div>

        {/* Right column: Facility Info */}
        <div className="space-y-4">
          {/* Referring Facility */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Referring Facility
            </h2>
            <p className="text-sm font-medium text-foreground">{refFacility?.name}</p>
            <FacilityTypeBadge type={refFacility?.facility_type} />
            <p className="mt-2 text-xs text-muted-foreground">
              {refFacility?.address}, {refFacility?.city}
            </p>
            {isSender && (
              <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Your Facility
              </span>
            )}
          </div>

          {/* Receiving Facility */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Receiving Facility
            </h2>
            <p className="text-sm font-medium text-foreground">{recFacility?.name}</p>
            <FacilityTypeBadge type={recFacility?.facility_type} />
            <p className="mt-2 text-xs text-muted-foreground">
              {recFacility?.address}, {recFacility?.city}
            </p>
            {isReceiver && (
              <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Your Facility
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Details
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(referral.created_at), "MMM d, yyyy h:mm a")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span>{(referral.created_by_profile as any)?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{format(new Date(referral.updated_at), "MMM d, yyyy h:mm a")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}
