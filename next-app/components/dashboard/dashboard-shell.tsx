"use client"

import { useState, type ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { FacilityThemeProvider } from "@/components/dashboard/facility-theme-provider"
import { Toaster } from "@/components/ui/toast"
import { AuthProvider } from "@/lib/auth/auth-context"
import type { ProfileWithFacility } from "@/lib/types/database"
import { FACILITY_THEMES } from "@/lib/constants/facility-themes"
import type { FacilityType } from "@/lib/constants/facility-themes"

export function DashboardShell({
  user,
  children,
}: {
  user: ProfileWithFacility
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const facilityType = (user.facility?.facility_type ?? "BHS") as FacilityType
  const facilityName = user.facility?.name ?? "Unknown Facility"
  const theme = FACILITY_THEMES[facilityType]

  return (
    <AuthProvider initialUser={user}>
      <FacilityThemeProvider facilityType={facilityType}>
        <Toaster>
          <div className="flex h-svh overflow-hidden bg-gray-50/50">
            <DashboardSidebar
              facilityName={facilityName}
              facilityType={theme.label}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
              <DashboardHeader
                userName={user.full_name}
                onMenuClick={() => setSidebarOpen(true)}
              />
              <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                {children}
              </main>
            </div>
          </div>
        </Toaster>
      </FacilityThemeProvider>
    </AuthProvider>
  )
}
