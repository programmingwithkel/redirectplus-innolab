import { PageHeader } from "@/components/shared/page-header"
import { HealthcareServicesView } from "@/components/healthcare-services/healthcare-services-view"
import { fetchHealthcareServicesData } from "@/lib/queries/healthcare-services"

export const dynamic = "force-dynamic"


export default async function AdminHealthcareServicesPage() {
  const data = await fetchHealthcareServicesData()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared Healthcare Services"
        description="System-wide view of reported doctors, specializations, rooms, beds, and healthcare services across all facilities."
      />

      <HealthcareServicesView data={data} userRole="super_admin" />
    </div>
  )
}
