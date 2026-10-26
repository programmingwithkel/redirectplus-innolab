import { isTimestampFresh } from "../../config/freshness-policy"
import type { Finding } from "../types"
import type { EligibilityRule, RuleContext } from "./eligibility-rule"

export class OperationalStatusRule implements EligibilityRule {
  readonly id = "OPERATIONAL_STATUS"

  evaluate(ctx: RuleContext): Finding[] {
    const { facility, requirement, now } = ctx

    if (facility.operatingStatus === "CLOSED") {
      return [
        {
          code: "FACILITY_CLOSED",
          verdict: "EXCLUDE",
          message: `${facility.name} is currently closed`,
          recordedAt: facility.operatingStatusUpdatedAt,
        },
      ]
    }

    if (facility.operatingStatus === "UNKNOWN") {
      return [
        {
          code: "OPERATING_STATUS_UNVERIFIED",
          verdict: "UNVERIFIED",
          message: `${facility.name} operating status has not been confirmed`,
          recordedAt: facility.operatingStatusUpdatedAt,
        },
      ]
    }

    // Check freshness of operating status
    const fresh = isTimestampFresh(
      facility.operatingStatusUpdatedAt,
      "OPERATING_STATUS",
      requirement.urgency,
      now
    )

    if (!fresh) {
      return [
        {
          code: "OPERATING_STATUS_UNVERIFIED",
          verdict: "UNVERIFIED",
          message: `${facility.name} operating status report is stale`,
          recordedAt: facility.operatingStatusUpdatedAt,
        },
      ]
    }

    if (facility.operatingStatus === "LIMITED_OPERATIONS") {
      return [
        {
          code: "LIMITED_OPERATIONS",
          verdict: "PASS",
          message: `${facility.name} is operating with limited capacity`,
          recordedAt: facility.operatingStatusUpdatedAt,
        },
      ]
    }

    return [
      {
        code: "OPERATIONAL",
        verdict: "PASS",
        message: `${facility.name} is fully operational`,
        recordedAt: facility.operatingStatusUpdatedAt,
      },
    ]
  }
}
