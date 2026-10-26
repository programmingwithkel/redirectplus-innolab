import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { FacilityDirectoryTabs } from "@/components/facilities/facility-directory-tabs"

export default async function FacilitiesPage() {
  const user = await getUser()
  if (!user || !user.facility_id) redirect("/login")

  const supabase = await createClient()

  const { data: facilities } = await supabase
    .from("facilities")
    .select(
      `*, resources:facility_resources(id, resource_name, resource_category, status, quantity)`
    )
    .eq("is_active", true)
    .order("facility_type")
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Routing & Facility Directory"
        description="Recommend the nearest clinically capable and available hospital based on patient urgency, services, and live travel time."
      />

      <FacilityDirectoryTabs
        initialFacilities={facilities || []}
        currentUserId={user.id}
        currentUserFacilityId={user.facility_id}
      />
    </div>
  )
}

