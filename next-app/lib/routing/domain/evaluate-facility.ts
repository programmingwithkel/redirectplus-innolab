import { isValidGeoPoint } from "./geo"
import { AcceptanceStatusRule } from "./rules/acceptance-status.rule"
import type { EligibilityRule, RuleContext } from "./rules/eligibility-rule"
import { FacilityTierRule } from "./rules/facility-tier.rule"
import { MandatoryResourceRule } from "./rules/mandatory-resource.rule"
import { OperationalStatusRule } from "./rules/operational-status.rule"
import { ServiceCapabilityRule } from "./rules/service-capability.rule"
import type {
  CareRequirement,
  EvaluationVerdict,
  ExclusionKind,
  FacilityEvaluation,
  FacilitySnapshot,
  Finding,
} from "./types"

export const DEFAULT_ELIGIBILITY_RULES: EligibilityRule[] = [
  new OperationalStatusRule(),
  new FacilityTierRule(),
  new ServiceCapabilityRule(),
  new MandatoryResourceRule(),
  new AcceptanceStatusRule(),
]

function determineExclusionKind(primaryIssue: Finding): ExclusionKind {
  switch (primaryIssue.code) {
    case "LOCATION_MISSING":
      return "LOCATION"
    case "FACILITY_CLOSED":
    case "OPERATING_STATUS_UNVERIFIED":
      return "OPERATIONAL"
    case "TIER_INSUFFICIENT_FOR_EMERGENCY":
    case "SERVICE_MISSING":
    case "SERVICE_INACTIVE":
      return "CAPABILITY"
    case "RESOURCE_UNAVAILABLE":
    case "NOT_ACCEPTING":
    default:
      return "AVAILABILITY"
  }
}

export function evaluateFacility(
  facility: FacilitySnapshot,
  requirement: CareRequirement,
  now: Date = new Date(),
  rules: EligibilityRule[] = DEFAULT_ELIGIBILITY_RULES
): FacilityEvaluation {
  const context: RuleContext = { facility, requirement, now }
  const findings: Finding[] = []

  // Check valid coordinates
  if (!isValidGeoPoint(facility.location)) {
    findings.push({
      code: "LOCATION_MISSING",
      verdict: "EXCLUDE",
      message: `${facility.name} has no valid geographical coordinates registered`,
    })
  }

  // Execute all rules
  for (const rule of rules) {
    const ruleFindings = rule.evaluate(context)
    findings.push(...ruleFindings)
  }

  const excludeFindings = findings.filter((f) => f.verdict === "EXCLUDE")
  const unverifiedFindings = findings.filter((f) => f.verdict === "UNVERIFIED")
  const passFindings = findings.filter((f) => f.verdict === "PASS")

  let verdict: EvaluationVerdict
  let primaryIssue: Finding | null = null
  let exclusionKind: ExclusionKind | null = null

  if (excludeFindings.length > 0) {
    verdict = "EXCLUDED"
    primaryIssue = excludeFindings[0]
    exclusionKind = determineExclusionKind(primaryIssue)
  } else if (unverifiedFindings.length > 0) {
    verdict = "UNVERIFIED"
    primaryIssue = unverifiedFindings[0]
  } else {
    verdict = "CONFIRMED"
  }

  // Determine oldest evidence timestamp among PASS findings
  let oldestEvidenceAt: string | null = null
  let minTime = Infinity

  for (const f of passFindings) {
    if (f.recordedAt) {
      const t = new Date(f.recordedAt).getTime()
      if (!isNaN(t) && t < minTime) {
        minTime = t
        oldestEvidenceAt = f.recordedAt
      }
    }
  }

  return {
    facility,
    verdict,
    exclusionKind,
    primaryIssue,
    evidence: passFindings,
    issues: [...excludeFindings, ...unverifiedFindings],
    oldestEvidenceAt,
  }
}
