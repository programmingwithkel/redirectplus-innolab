import { deriveAcceptanceAvailability } from "../availability"
import type { Finding } from "../types"
import type { EligibilityRule, RuleContext } from "./eligibility-rule"

export class AcceptanceStatusRule implements EligibilityRule {
  readonly id = "ACCEPTANCE_STATUS"

  evaluate(ctx: RuleContext): Finding[] {
    const { facility, requirement, now } = ctx

    const acceptance = facility.acceptance.find(
      (a) => a.caseCategory === requirement.caseCategory
    )

    const { state, isExpired, reason } = deriveAcceptanceAvailability(acceptance, now)

    if (state === "CONFIRMED_UNAVAILABLE") {
      return [
        {
          code: "NOT_ACCEPTING",
          verdict: "EXCLUDE",
          message: reason,
          subject: requirement.caseCategory,
          recordedAt: acceptance?.lastUpdatedAt,
        },
      ]
    }

    if (state === "UNKNOWN") {
      const code = isExpired
        ? "ACCEPTANCE_EXPIRED"
        : !acceptance
        ? "ACCEPTANCE_MISSING"
        : "ACCEPTANCE_UNKNOWN"

      return [
        {
          code,
          verdict: "UNVERIFIED",
          message: reason,
          subject: requirement.caseCategory,
          recordedAt: acceptance?.lastUpdatedAt,
        },
      ]
    }

    return [
      {
        code:
          acceptance?.status === "ACCEPTING_WITH_CONDITIONS"
            ? "ACCEPTING_WITH_CONDITIONS"
            : "ACCEPTING",
        verdict: "PASS",
        message: reason,
        subject: requirement.caseCategory,
        recordedAt: acceptance?.lastUpdatedAt,
      },
    ]
  }
}
