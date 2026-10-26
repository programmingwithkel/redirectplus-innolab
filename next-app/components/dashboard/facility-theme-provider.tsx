"use client"

import { useAuth } from "@/lib/auth/auth-context"
import type { FacilityType } from "@/lib/types/database"
import { FACILITY_THEMES } from "@/lib/constants/facility-themes"
import type { ReactNode } from "react"

/**
 * Sets CSS custom properties for the current user's facility accent colors.
 * These variables are consumed by dashboard components for themed accents.
 */
export function FacilityThemeProvider({
  facilityType,
  children,
}: {
  facilityType: FacilityType
  children: ReactNode
}) {
  const theme = FACILITY_THEMES[facilityType]

  return (
    <div
      style={
        {
          "--facility-primary": theme.primary,
          "--facility-light": theme.light,
          "--facility-dark": theme.dark,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
