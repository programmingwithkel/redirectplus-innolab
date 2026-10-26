import type { ReferralStatus } from "@/lib/constants/referral-status"
import { ReferralDomainError } from "../domain/errors"
import { assertCanTransition, transitionEventType } from "../domain/incoming-referral-policy"
import type { ReceiverActor } from "../domain/types"
import { loadReferralForReceiver } from "./load-referral-for-receiver"
import type { IncomingReferralReader, IncomingReferralWriter, ReferralEventLog } from "./ports"

export interface TransitionIncomingReferralInput {
  referralId: string
  nextStatus: ReferralStatus
  note?: string | null
}

/** UPDATE (status): acknowledge, accept, decline, start treatment, complete. */
export class TransitionIncomingReferralUseCase {
  constructor(
    private readonly reader: IncomingReferralReader,
    private readonly writer: IncomingReferralWriter,
    private readonly eventLog: ReferralEventLog
  ) {}

  async execute(actor: ReceiverActor, input: TransitionIncomingReferralInput): Promise<void> {
    const referral = await loadReferralForReceiver(this.reader, actor, input.referralId)
    assertCanTransition(referral, input.nextStatus)

    const updated = await this.writer.updateStatus(
      referral.id,
      referral.status,
      input.nextStatus
    )
    if (!updated) {
      throw new ReferralDomainError(
        "CONFLICT",
        "This referral was updated by someone else. Refresh and try again."
      )
    }

    await this.eventLog.record({
      referralId: referral.id,
      eventType: transitionEventType(input.nextStatus),
      previousStatus: referral.status,
      newStatus: input.nextStatus,
      notes: input.note ?? null,
      actorId: actor.userId,
    })
  }
}
