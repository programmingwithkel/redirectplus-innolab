import "server-only"
import { GetIncomingReferralUseCase } from "./application/get-incoming-referral"
import { ListIncomingReferralsUseCase } from "./application/list-incoming-referrals"
import { SetIncomingReferralArchivedUseCase } from "./application/set-incoming-referral-archived"
import { TransitionIncomingReferralUseCase } from "./application/transition-incoming-referral"
import { UpdateIncomingReferralDetailsUseCase } from "./application/update-incoming-referral-details"
import { SupabaseIncomingReferralRepository } from "./infrastructure/supabase-incoming-referral-repository"
import { SupabaseReferralEventLog } from "./infrastructure/supabase-referral-event-log"

/**
 * Composition root: the only place concrete adapters are chosen and wired
 * into the use cases. Swap an adapter here without touching any use case.
 */
export function createIncomingReferralServices() {
  const repository = new SupabaseIncomingReferralRepository()
  const eventLog = new SupabaseReferralEventLog()
  const clock = { now: () => new Date() }

  return {
    list: new ListIncomingReferralsUseCase(repository),
    get: new GetIncomingReferralUseCase(repository),
    updateDetails: new UpdateIncomingReferralDetailsUseCase(repository, repository, eventLog),
    transition: new TransitionIncomingReferralUseCase(repository, repository, eventLog),
    setArchived: new SetIncomingReferralArchivedUseCase(repository, repository, eventLog, clock),
  }
}
