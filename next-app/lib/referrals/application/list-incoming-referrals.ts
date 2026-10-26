import type {
  IncomingReferral,
  IncomingReferralQuery,
  Paginated,
  ReceiverActor,
} from "../domain/types"
import type { IncomingReferralReader } from "./ports"

export type ListIncomingReferralsInput = Omit<IncomingReferralQuery, "facilityId">

/** READ (collection): the receiver's inbox with search, filters, and pagination. */
export class ListIncomingReferralsUseCase {
  constructor(private readonly reader: IncomingReferralReader) {}

  execute(
    actor: ReceiverActor,
    input: ListIncomingReferralsInput
  ): Promise<Paginated<IncomingReferral>> {
    // facilityId always comes from the authenticated actor, never from input
    return this.reader.list({ ...input, facilityId: actor.facilityId })
  }
}
