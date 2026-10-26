import { assertCanArchive, assertCanUnarchive } from "../domain/incoming-referral-policy"
import type { ReceiverActor } from "../domain/types"
import { loadReferralForReceiver } from "./load-referral-for-receiver"
import type {
  Clock,
  IncomingReferralReader,
  IncomingReferralWriter,
  ReferralEventLog,
} from "./ports"

export interface SetIncomingReferralArchivedInput {
  referralId: string
  archived: boolean
}

/**
 * DELETE (soft): hide a closed referral from the receiver's inbox, or restore it.
 * Nothing is ever removed, so the referral and its audit trail stay intact.
 */
export class SetIncomingReferralArchivedUseCase {
  constructor(
    private readonly reader: IncomingReferralReader,
    private readonly writer: IncomingReferralWriter,
    private readonly eventLog: ReferralEventLog,
    private readonly clock: Clock
  ) {}

  async execute(actor: ReceiverActor, input: SetIncomingReferralArchivedInput): Promise<void> {
    const referral = await loadReferralForReceiver(this.reader, actor, input.referralId)

    if (input.archived) {
      assertCanArchive(referral)
      await this.writer.setArchived(referral.id, { at: this.clock.now(), by: actor.userId })
    } else {
      assertCanUnarchive(referral)
      await this.writer.setArchived(referral.id, null)
    }

    await this.eventLog.record({
      referralId: referral.id,
      eventType: input.archived ? "ARCHIVED" : "UNARCHIVED",
      previousStatus: referral.status,
      newStatus: referral.status,
      notes: input.archived
        ? "Archived from receiving facility inbox"
        : "Restored to receiving facility inbox",
      actorId: actor.userId,
    })
  }
}
