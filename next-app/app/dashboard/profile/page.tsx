import { getUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { FACILITY_THEMES } from "@/lib/constants/facility-themes"
import type { FacilityType } from "@/lib/constants/facility-themes"
import { User, Building2, Mail, Shield } from "lucide-react"

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const facilityType = user.facility?.facility_type as FacilityType | undefined
  const theme = facilityType ? FACILITY_THEMES[facilityType] : null

  return (
    <div>
      <PageHeader title="Profile" description="Your account information" />

      <div className="max-w-2xl space-y-4">
        {/* User Info */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            Account Information
          </h2>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={user.full_name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Role" value={user.role === "super_admin" ? "Super Admin" : "Operational Staff"} />
            <InfoRow label="Status" value={user.is_active ? "Active" : "Inactive"} />
          </div>
        </div>

        {/* Facility Info */}
        {user.facility && theme && (
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Assigned Facility
            </h2>
            <div className="space-y-3">
              <InfoRow label="Facility Name" value={user.facility.name} />
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">
                  Facility Type
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: theme.light,
                    color: theme.dark,
                  }}
                >
                  {theme.label}
                </span>
              </div>
              <InfoRow
                label="Location"
                value={`${user.facility.address ?? ""}, ${user.facility.city ?? ""}, ${user.facility.province ?? ""}`}
              />
              <InfoRow
                label="Contact"
                value={user.facility.contact_number ?? "N/A"}
              />
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 text-yellow-700" />
            <p className="text-xs text-yellow-800">
              Role, facility assignment, and facility type cannot be changed
              from this page. Contact your system administrator for changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}
