"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getUser } from "@/lib/auth/get-user"
import { createIncomingReferralServices } from "@/lib/referrals"
import { isReferralDomainError } from "@/lib/referrals/domain/errors"
import type { ReceiverActor } from "@/lib/referrals/domain/types"
import {
  SetIncomingReferralArchivedSchema,
  TransitionIncomingReferralSchema,
  UpdateIncomingReferralDetailsSchema,
} from "@/lib/validation/incoming-referral-schemas"

/**
 * Thin delivery layer for incoming-referral management.
 * Each action does only: authenticate → validate → delegate to a use case → revalidate.
 * Business rules live in lib/referrals; nothing here talks to the database directly.
 */

export type IncomingReferralActionResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function updateIncomingReferralDetailsAction(
  input: unknown
): Promise<IncomingReferralActionResult> {
  return runAction(UpdateIncomingReferralDetailsSchema, input, async (actor, data, services) => {
    const changes = await services.updateDetails.execute(actor, data)
    revalidateReferral(data.referralId)
    return `Updated ${changes.length} field${changes.length === 1 ? "" : "s"}`
  })
}

export async function transitionIncomingReferralAction(
  input: unknown
): Promise<IncomingReferralActionResult> {
  return runAction(TransitionIncomingReferralSchema, input, async (actor, data, services) => {
    await services.transition.execute(actor, data)
    revalidateReferral(data.referralId)
    return `Referral marked as ${data.nextStatus.replace("_", " ").toLowerCase()}`
  })
}

export async function setIncomingReferralArchivedAction(
  input: unknown
): Promise<IncomingReferralActionResult> {
  return runAction(SetIncomingReferralArchivedSchema, input, async (actor, data, services) => {
    await services.setArchived.execute(actor, data)
    revalidateReferral(data.referralId)
    return data.archived ? "Referral archived" : "Referral restored to inbox"
  })
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type Services = ReturnType<typeof createIncomingReferralServices>

async function runAction<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  handler: (actor: ReceiverActor, data: z.output<Schema>, services: Services) => Promise<string>
): Promise<IncomingReferralActionResult> {
  const actor = await getReceiverActor()
  if (!actor) return { success: false, error: "Not authorized" }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields",
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  try {
    const message = await handler(actor, parsed.data, createIncomingReferralServices())
    return { success: true, message }
  } catch (error) {
    if (isReferralDomainError(error)) {
      return { success: false, error: error.message }
    }
    console.error("[incoming-referrals] Unexpected action error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

async function getReceiverActor(): Promise<ReceiverActor | null> {
  const user = await getUser()
  if (!user || !user.facility_id || !user.is_active) return null
  return { userId: user.id, facilityId: user.facility_id }
}

function revalidateReferral(referralId: string) {
  revalidatePath("/dashboard/referrals/incoming")
  revalidatePath(`/dashboard/referrals/${referralId}`)
  revalidatePath("/dashboard")
}

/** Keys errors by their full path (e.g. "patch.patientAge") so nested fields map to inputs. */
function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form"
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return fieldErrors
}
