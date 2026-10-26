import { getUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) redirect("/login")
  if (user.role !== "super_admin") redirect("/unauthorized")

  return <AdminShell user={user}>{children}</AdminShell>
}
