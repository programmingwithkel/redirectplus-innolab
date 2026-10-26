import { getUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { HealthcareServicesView } from "@/components/healthcare-services/healthcare-services-view"
import { fetchHealthcareServicesData } from "@/lib/queries/healthcare-services"

export const dynamic = "force-dynamic"


export default async function DashboardHealthcareServicesPage() {
  const user = await getUser()
  if (!user || !user.facility_id) redirect("/login")

  const data = await fetchHealthcareServicesData()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared Healthcare Services"
        description="View reported doctors, specializations, rooms, beds, and healthcare services across all facilities in the network."
      />

      <HealthcareServicesView data={data} userRole="operational" />
    </div>
  )
}
