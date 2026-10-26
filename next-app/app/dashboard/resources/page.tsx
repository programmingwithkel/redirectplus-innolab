import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { ResourceTable } from "@/components/resources/resource-table"
import { AddResourceForm } from "@/components/resources/add-resource-form"
import { HospitalAvailabilityDashboard } from "@/components/availability/hospital-availability-dashboard"

export default async function ResourcesPage() {
  const user = await getUser()
  if (!user || !user.facility_id) redirect("/login")

  const supabase = await createClient()

  // Fetch facility record
  const { data: facility } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", user.facility_id)
    .single()

  // Fetch acceptance records
  const { data: acceptanceList } = await supabase
    .from("facility_acceptance_status")
    .select("*")
    .eq("facility_id", user.facility_id)
    .order("case_category")

  // Fetch resources
  const { data: resources } = await supabase
    .from("facility_resources")
    .select("*")
    .eq("facility_id", user.facility_id)
    .order("resource_category")
    .order("resource_name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Resources & Availability"
        description={`Manage operating status, live case acceptance, beds, and equipment for ${user.facility?.name}`}
      />

      {/* Hospital Availability & Acceptance Control */}
      <HospitalAvailabilityDashboard
        facility={facility}
        acceptanceList={acceptanceList ?? []}
      />

      {/* Add Resource Form */}
      <AddResourceForm />

      {/* Resources Table */}
      <ResourceTable resources={resources ?? []} />
    </div>
  )
}

