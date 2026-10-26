import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ReferralEventLog } from "../application/ports"
import type { ReferralEventRecord } from "../domain/types"
import type { SupabaseClientFactory } from "./supabase-incoming-referral-repository"

/** Writes entries to the immutable `referral_events` audit trail. */
export class SupabaseReferralEventLog implements ReferralEventLog {
  constructor(private readonly clientFactory: SupabaseClientFactory = createClient) {}

  async record(event: ReferralEventRecord): Promise<void> {
    const supabase = await this.clientFactory()
    const { error } = await supabase.from("referral_events").insert({
      referral_id: event.referralId,
      event_type: event.eventType,
      previous_status: event.previousStatus,
      new_status: event.newStatus,
      notes: event.notes,
      actor_id: event.actorId,
    })

    // The primary change has already been committed at this point (PostgREST
    // has no multi-statement transactions). Failing the request would tell the
    // user their action failed when it didn't, so surface the gap loudly in logs.
    if (error) {
      console.error("[incoming-referrals] Failed to record audit event:", { event, error })
    }
  }
}
