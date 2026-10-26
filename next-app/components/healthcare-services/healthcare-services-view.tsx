"use client"

import { useState } from "react"
import {
  Stethoscope,
  Bed,
  Activity,
} from "lucide-react"
import { HealthcareServicesStatsSection } from "./healthcare-services-stats"
import { DoctorsSpecializationsSection } from "./doctors-specializations-section"
import { BedsRoomsSection } from "./beds-rooms-section"
import { ServicesSection } from "./services-section"
import type { HealthcareServicesData } from "@/lib/types/healthcare-services"

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabKey = "doctors" | "beds" | "services"

const TABS: { key: TabKey; label: string; icon: typeof Stethoscope }[] = [
  { key: "doctors", label: "Doctors & Specializations", icon: Stethoscope },
  { key: "beds", label: "Rooms & Beds", icon: Bed },
  { key: "services", label: "Healthcare Services", icon: Activity },
]

// ─── Props ───────────────────────────────────────────────────────────────────

interface HealthcareServicesViewProps {
  data: HealthcareServicesData
  userRole: "super_admin" | "operational"
}

/**
 * Composed view component shared between admin and dashboard pages.
 * Applies DRY principle: a single UI used by both user levels.
 * The `userRole` prop allows conditional rendering if needed.
 */
export function HealthcareServicesView({
  data,
  userRole,
}: HealthcareServicesViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("doctors")

  return (
    <div className="space-y-6">
      {/* Stats */}
      <HealthcareServicesStatsSection stats={data.stats} />

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1" aria-label="Healthcare services tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`
                  group inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-all
                  ${
                    isActive
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                  }
                `}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive
                      ? "text-emerald-600"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                {tab.label}
                {/* Count badge */}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.key === "doctors"
                    ? data.doctors.length
                    : tab.key === "beds"
                      ? data.beds.length
                      : data.services.length}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "doctors" && (
          <DoctorsSpecializationsSection doctors={data.doctors} />
        )}
        {activeTab === "beds" && <BedsRoomsSection beds={data.beds} />}
        {activeTab === "services" && (
          <ServicesSection services={data.services} />
        )}
      </div>
    </div>
  )
}
