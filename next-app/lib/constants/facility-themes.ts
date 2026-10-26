// Facility type constants and theme colors
// These are derived from the facility's type in the database, NOT user-selectable

export const FACILITY_TYPES = {
  BHS: "BHS",
  RHU: "RHU",
  SECONDARY: "SECONDARY",
  TERTIARY: "TERTIARY",
} as const

export type FacilityType = (typeof FACILITY_TYPES)[keyof typeof FACILITY_TYPES]

export interface FacilityTheme {
  primary: string
  light: string
  dark: string
  label: string
  description: string
}

export const FACILITY_THEMES: Record<FacilityType, FacilityTheme> = {
  BHS: {
    primary: "#15803D",
    light: "#DCFCE7",
    dark: "#166534",
    label: "Barangay Health Station",
    description: "Community Health",
  },
  RHU: {
    primary: "#2563EB",
    light: "#DBEAFE",
    dark: "#1D4ED8",
    label: "Rural Health Unit",
    description: "Primary Care",
  },
  SECONDARY: {
    primary: "#0D9488",
    light: "#CCFBF1",
    dark: "#0F766E",
    label: "Secondary Hospital",
    description: "Hospital Care",
  },
  TERTIARY: {
    primary: "#9333EA",
    light: "#F3E8FF",
    dark: "#7E22CE",
    label: "Tertiary Hospital",
    description: "Advanced Specialist Care",
  },
} as const

export function getFacilityTheme(facilityType: FacilityType): FacilityTheme {
  return FACILITY_THEMES[facilityType]
}
