import type { FacilityEvaluation, RankedFacility } from "./types"

export function formatExclusionExplanation(evaluation: FacilityEvaluation): string {
  if (evaluation.verdict !== "EXCLUDED") return ""
  if (!evaluation.primaryIssue) return "Facility does not satisfy patient requirements."

  return evaluation.primaryIssue.message
}

export function formatEvidenceList(evaluation: FacilityEvaluation): string[] {
  return evaluation.evidence.map((e) => e.message)
}

export function formatNearerExcludedComparison(
  recommended: RankedFacility,
  nearer: RankedFacility
): string {
  const reason = formatExclusionExplanation(nearer)
  const nearerDur = nearer.travel.durationSeconds
    ? `${Math.round(nearer.travel.durationSeconds / 60)} min`
    : nearer.straightLineMeters
    ? `${(nearer.straightLineMeters / 1000).toFixed(1)} km`
    : "closer"

  return `${nearer.facility.name} is ${nearerDur} away but was excluded: ${reason}`
}
