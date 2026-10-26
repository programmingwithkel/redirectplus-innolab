import type { ReferralStatus } from "@/lib/constants/referral-status"
import type {
  IncomingReferral,
  IncomingReferralQuery,
  Paginated,
  ReferralDetailsPatch,
  ReferralEventRecord,
} from "../domain/types"

/**
 * Ports (interfaces) the use cases depend on. Infrastructure provides the
 * implementations, so the application layer never imports Supabase (DIP).
 * Read, write, and audit concerns are kept separate (ISP).
 */

export interface IncomingReferralReader {
  list(query: IncomingReferralQuery): Promise<Paginated<IncomingReferral>>
  /** Returns the referral only if it is addressed to `facilityId`. */
  findForReceiver(referralId: string, facilityId: string): Promise<IncomingReferral | null>
}

export interface IncomingReferralWriter {
  updateDetails(referralId: string, patch: ReferralDetailsPatch): Promise<void>

  /**
   * Compare-and-set status update. Returns false if the referral's status is
   * no longer `expected`, meaning someone else changed it concurrently.
   */
  updateStatus(
    referralId: string,
    expected: ReferralStatus,
    next: ReferralStatus
  ): Promise<boolean>

  setArchived(referralId: string, archive: { at: Date; by: string } | null): Promise<void>
}

export interface ReferralEventLog {
  record(event: ReferralEventRecord): Promise<void>
}

export interface Clock {
  now(): Date
}
