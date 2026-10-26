import { ReferralDomainError } from "../domain/errors"
import { assertIsReceiver } from "../domain/incoming-referral-policy"
import type { IncomingReferral, ReceiverActor } from "../domain/types"
import type { IncomingReferralReader } from "./ports"

/**
 * Shared guard for every receiver use case: the referral must exist and be
 * addressed to the actor's facility. Returns "not found" for both cases so
 * callers can't probe for referrals belonging to other facilities.
 */
export async function loadReferralForReceiver(
  reader: IncomingReferralReader,
  actor: ReceiverActor,
  referralId: string
): Promise<IncomingReferral> {
  const referral = await reader.findForReceiver(referralId, actor.facilityId)
  if (!referral) {
    throw new ReferralDomainError("NOT_FOUND", "Referral not found")
  }
  assertIsReceiver(referral, actor)
  return referral
}
