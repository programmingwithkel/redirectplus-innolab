import { getUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) redirect("/login")
  if (user.role === "super_admin") redirect("/admin")
  if (!user.facility_id || !user.facility) redirect("/unauthorized")

  return <DashboardShell user={user}>{children}</DashboardShell>
}
