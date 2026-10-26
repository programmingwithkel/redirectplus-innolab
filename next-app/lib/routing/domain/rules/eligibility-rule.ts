import type {
  CareRequirement,
  FacilitySnapshot,
  Finding,
} from "../types"

export interface RuleContext {
  facility: FacilitySnapshot
  requirement: CareRequirement
  now: Date
}

export interface EligibilityRule {
  readonly id: string
  evaluate(ctx: RuleContext): Finding[]
}
