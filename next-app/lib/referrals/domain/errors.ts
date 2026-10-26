export type ReferralErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "NO_CHANGES"
  | "CONFLICT"
  | "PERSISTENCE"

/**
 * Expected, user-presentable failures raised by the referral domain and
 * application layers. Anything else is treated as an unexpected error.
 */
export class ReferralDomainError extends Error {
  constructor(
    readonly code: ReferralErrorCode,
    message: string
  ) {
    super(message)
    this.name = "ReferralDomainError"
  }
}

export function isReferralDomainError(error: unknown): error is ReferralDomainError {
  return error instanceof ReferralDomainError
}
