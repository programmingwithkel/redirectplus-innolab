import { getReceiverCapabilities } from "../domain/incoming-referral-policy"
import type { IncomingReferral, ReceiverActor, ReceiverCapabilities } from "../domain/types"
import { loadReferralForReceiver } from "./load-referral-for-receiver"
import type { IncomingReferralReader } from "./ports"

export interface IncomingReferralView {
  referral: IncomingReferral
  capabilities: ReceiverCapabilities
}

/** READ (single): one incoming referral plus what the receiver may do with it. */
export class GetIncomingReferralUseCase {
  constructor(private readonly reader: IncomingReferralReader) {}

  async execute(actor: ReceiverActor, referralId: string): Promise<IncomingReferralView> {
    const referral = await loadReferralForReceiver(this.reader, actor, referralId)
    return { referral, capabilities: getReceiverCapabilities(referral) }
  }
}
