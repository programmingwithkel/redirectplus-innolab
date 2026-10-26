import { ReferralDomainError } from "../domain/errors"
import {
  assertCanEditDetails,
  describeChanges,
  diffDetails,
  pickChangedFields,
} from "../domain/incoming-referral-policy"
import type { FieldChange, ReceiverActor, ReferralDetailsPatch } from "../domain/types"
import { loadReferralForReceiver } from "./load-referral-for-receiver"
import type { IncomingReferralReader, IncomingReferralWriter, ReferralEventLog } from "./ports"

export interface UpdateIncomingReferralDetailsInput {
  referralId: string
  patch: ReferralDetailsPatch
  note?: string | null
}

/** UPDATE (details): receiver corrects triage/patient info. Every change is audited. */
export class UpdateIncomingReferralDetailsUseCase {
  constructor(
    private readonly reader: IncomingReferralReader,
    private readonly writer: IncomingReferralWriter,
    private readonly eventLog: ReferralEventLog
  ) {}

  async execute(
    actor: ReceiverActor,
    input: UpdateIncomingReferralDetailsInput
  ): Promise<FieldChange[]> {
    const referral = await loadReferralForReceiver(this.reader, actor, input.referralId)
    assertCanEditDetails(referral)

    const changes = diffDetails(referral, input.patch)
    if (changes.length === 0) {
      throw new ReferralDomainError("NO_CHANGES", "No changes to save")
    }

    // Persist only what changed so concurrent edits to other fields aren't clobbered
    await this.writer.updateDetails(referral.id, pickChangedFields(changes))

    const summary = describeChanges(changes)
    await this.eventLog.record({
      referralId: referral.id,
      eventType: "DETAILS_UPDATED",
      previousStatus: referral.status,
      newStatus: referral.status,
      notes: input.note ? `${summary}. Note: ${input.note}` : summary,
      actorId: actor.userId,
    })

    return changes
  }
}
