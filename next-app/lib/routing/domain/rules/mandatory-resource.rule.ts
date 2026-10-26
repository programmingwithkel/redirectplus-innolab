import { deriveResourceAvailability } from "../availability"
import type { Finding } from "../types"
import type { EligibilityRule, RuleContext } from "./eligibility-rule"

export class MandatoryResourceRule implements EligibilityRule {
  readonly id = "MANDATORY_RESOURCE"

  evaluate(ctx: RuleContext): Finding[] {
    const { facility, requirement, now } = ctx
    const findings: Finding[] = []

    for (const resourceTypeCode of requirement.mandatoryResources) {
      // Strictly match typed resources. Legacy rows (resource_type === null) are ignored.
      const resource = facility.resources.find((r) => r.type === resourceTypeCode)

      if (!resource) {
        findings.push({
          code: "RESOURCE_MISSING",
          verdict: "UNVERIFIED",
          message: `No availability record for mandatory resource: ${resourceTypeCode.replace(/_/g, " ")}`,
          subject: resourceTypeCode,
        })
        continue
      }

      const { state, isFresh } = deriveResourceAvailability(
        resource,
        requirement.urgency,
        now
      )

      if (state === "CONFIRMED_UNAVAILABLE") {
        findings.push({
          code: "RESOURCE_UNAVAILABLE",
          verdict: "EXCLUDE",
          message: `${resource.label} is confirmed unavailable`,
          subject: resourceTypeCode,
          recordedAt: resource.updatedAt,
        })
      } else if (state === "UNKNOWN") {
        findings.push({
          code: !isFresh ? "RESOURCE_STALE" : "RESOURCE_UNKNOWN",
          verdict: "UNVERIFIED",
          message: !isFresh
            ? `${resource.label} availability record is stale`
            : `${resource.label} availability is unconfirmed`,
          subject: resourceTypeCode,
          recordedAt: resource.updatedAt,
        })
      } else {
        findings.push({
          code: resource.status === "LIMITED" ? "RESOURCE_LIMITED" : "RESOURCE_CONFIRMED",
          verdict: "PASS",
          message:
            resource.status === "LIMITED"
              ? `${resource.label} available (limited${resource.quantity != null ? `: ${resource.quantity}` : ""})`
              : `${resource.label} confirmed available${resource.quantity != null ? ` (${resource.quantity})` : ""}`,
          subject: resourceTypeCode,
          recordedAt: resource.updatedAt,
        })
      }
    }

    return findings
  }
}
