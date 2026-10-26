import { isTimestampFresh } from "../../config/freshness-policy"
import type { Finding } from "../types"
import type { EligibilityRule, RuleContext } from "./eligibility-rule"

export class ServiceCapabilityRule implements EligibilityRule {
  readonly id = "SERVICE_CAPABILITY"

  evaluate(ctx: RuleContext): Finding[] {
    const { facility, requirement, now } = ctx
    const findings: Finding[] = []

    for (const serviceCode of requirement.requiredServices) {
      const service = facility.services.find((s) => s.code === serviceCode)

      if (!service) {
        findings.push({
          code: "SERVICE_MISSING",
          verdict: "EXCLUDE",
          message: `Lacks required service capability: ${serviceCode.replace(/_/g, " ")}`,
          subject: serviceCode,
        })
        continue
      }

      if (!service.isActive) {
        findings.push({
          code: "SERVICE_INACTIVE",
          verdict: "EXCLUDE",
          message: `Required service ${service.label || serviceCode} is currently inactive`,
          subject: serviceCode,
          recordedAt: service.lastVerifiedAt,
        })
        continue
      }

      const fresh = isTimestampFresh(
        service.lastVerifiedAt,
        "SERVICE_VERIFICATION",
        requirement.urgency,
        now
      )

      if (!fresh) {
        findings.push({
          code: "SERVICE_UNVERIFIED",
          verdict: "UNVERIFIED",
          message: `Service ${service.label || serviceCode} has unverified or expired accreditation`,
          subject: serviceCode,
          recordedAt: service.lastVerifiedAt,
        })
      } else {
        findings.push({
          code: "SERVICE_VERIFIED",
          verdict: "PASS",
          message: `Verified capability for ${service.label || serviceCode}`,
          subject: serviceCode,
          recordedAt: service.lastVerifiedAt,
        })
      }
    }

    return findings
  }
}
