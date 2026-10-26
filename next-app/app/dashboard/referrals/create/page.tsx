import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { ReferralForm } from "@/components/referrals/referral-form"

export default async function CreateReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getUser()
  if (!user || !user.facility_id || !user.facility) redirect("/login")

  const resolvedParams = await searchParams
  const preselectedFacilityId = typeof resolvedParams.facilityId === "string" ? resolvedParams.facilityId : undefined
  const recommendationRunId = typeof resolvedParams.runId === "string" ? resolvedParams.runId : undefined
  const initialUrgency = typeof resolvedParams.urgency === "string" ? resolvedParams.urgency : undefined
  const initialService = typeof resolvedParams.service === "string" ? resolvedParams.service : undefined

  const supabase = await createClient()

  // Fetch all active facilities for the receiving facility dropdown
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <div>
      <PageHeader
        title="Create Referral"
        description="Submit a new patient referral to another facility"
      />
      <div className="max-w-3xl">
        <ReferralForm
          facilities={facilities ?? []}
          currentFacilityId={user.facility_id}
          currentFacilityName={user.facility.name}
          preselectedFacilityId={preselectedFacilityId}
          recommendationRunId={recommendationRunId}
          initialUrgency={initialUrgency}
          initialService={initialService}
        />
      </div>
    </div>
  )
}

