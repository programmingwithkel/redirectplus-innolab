import {
  Stethoscope,
  Bed,
  Activity,
  Building2,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { StatsCard } from "@/components/shared/stats-card"
import type { HealthcareServicesStats } from "@/lib/types/healthcare-services"

interface HealthcareServicesStatsProps {
  stats: HealthcareServicesStats
}

export function HealthcareServicesStatsSection({
  stats,
}: HealthcareServicesStatsProps) {
  return (
    <div className="space-y-3">
      {/* Primary stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard
          title="Facilities Reporting"
          value={stats.totalFacilities}
          icon={<Building2 className="h-4 w-4" />}
          accent
        />
        <StatsCard
          title="Specialists On-Call"
          value={stats.totalDoctorsOnCall}
          icon={<Stethoscope className="h-4 w-4" />}
          accent
        />
        <StatsCard
          title="Total Available Beds"
          value={stats.totalAvailableBeds}
          icon={<Bed className="h-4 w-4" />}
          accent
        />
        <StatsCard
          title="Active Services"
          value={stats.totalServices}
          icon={<Activity className="h-4 w-4" />}
          accent
        />
      </div>

      {/* Secondary breakdown row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatsCard
          title="Doctors Available"
          value={stats.doctorsAvailable}
          icon={<UserCheck className="h-4 w-4" />}
          description="On-call specialists"
        />
        <StatsCard
          title="Doctors Unavailable"
          value={stats.doctorsUnavailable}
          icon={<UserX className="h-4 w-4" />}
        />
        <StatsCard
          title="Beds Available"
          value={stats.bedsAvailable}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Beds Limited"
          value={stats.bedsLimited}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatsCard
          title="Beds Unavailable"
          value={stats.bedsUnavailable}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}
