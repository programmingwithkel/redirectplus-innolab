import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { AdminFacilityDirectory } from "@/components/admin/facility-directory"

export default async function AdminFacilityDirectoryPage() {
  const supabase = await createClient()

  const { data: facilities } = await supabase
    .from("facilities")
    .select(
      `*, resources:facility_resources(id, resource_name, resource_category, status, quantity),
       services:facility_services(id, service_code, capability_level, is_active),
       user_count:profiles(count)`
    )
    .order("facility_type")
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Directory"
        description="View all registered facilities, their services, resources, and operational status"
      />
      <AdminFacilityDirectory facilities={facilities ?? []} />
    </div>
  )
}
