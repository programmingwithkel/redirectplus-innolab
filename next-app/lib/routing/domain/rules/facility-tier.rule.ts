import type { Finding } from "../types"
import type { EligibilityRule, RuleContext } from "./eligibility-rule"

export class FacilityTierRule implements EligibilityRule {
  readonly id = "FACILITY_TIER"

  evaluate(ctx: RuleContext): Finding[] {
    const { facility, requirement } = ctx

    if (requirement.requiresHospitalEmergency) {
      if (facility.tier === "BHS" || facility.tier === "RHU") {
        // Check if facility has an explicitly verified EMERGENCY_CARE service
        const hasEmergency = facility.services.some(
          (s) => s.code === "EMERGENCY_CARE" && s.isActive
        )

        if (!hasEmergency) {
          const tierLabel = facility.tier === "BHS" ? "Barangay Health Station" : "Rural Health Unit"
          return [
            {
              code: "TIER_INSUFFICIENT_FOR_EMERGENCY",
              verdict: "EXCLUDE",
              message: `${tierLabel} is not equipped for hospital-level emergency care`,
              subject: facility.tier,
            },
          ]
        }
      }
    }

    return []
  }
}
