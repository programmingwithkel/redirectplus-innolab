"use server"

import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import type {
  AcceptanceReasonCode,
  AcceptanceStatus,
  OperatingStatus,
} from "@/lib/types/database"

export async function updateOperatingStatusAction(
  operatingStatus: OperatingStatus
): Promise<{ success?: boolean; error?: string }> {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized to update facility operating status" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("facilities")
    .update({
      operating_status: operatingStatus,
      operating_status_updated_at: new Date().toISOString(),
    })
    .eq("id", user.facility_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/facilities")
  revalidatePath("/dashboard/resources")
  return { success: true }
}

export async function updateAcceptanceStatusAction(params: {
  caseCategory: string
  acceptanceStatus: AcceptanceStatus
  reasonCode?: AcceptanceReasonCode | null
  validHours?: number
}): Promise<{ success?: boolean; error?: string }> {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized to update facility acceptance status" }
  }

  const supabase = await createClient()

  const validHours = Math.max(1, Math.min(params.validHours || 4, 24))
  const now = new Date()
  const expiresAt = new Date(now.getTime() + validHours * 3600 * 1000).toISOString()

  const { error } = await supabase
    .from("facility_acceptance_status")
    .upsert(
      {
        facility_id: user.facility_id,
        case_category: params.caseCategory,
        acceptance_status: params.acceptanceStatus,
        reason_code: params.reasonCode || null,
        updated_by: user.id,
        last_updated_at: now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "facility_id,case_category" }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/facilities")
  revalidatePath("/dashboard/resources")
  return { success: true }
}

export async function reconfirmResourceAction(
  resourceId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("facility_resources")
    .update({
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", resourceId)
    .eq("facility_id", user.facility_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/resources")
  revalidatePath("/dashboard/facilities")
  return { success: true }
}

export async function reconfirmAllFacilityResourcesAction(): Promise<{
  success?: boolean
  error?: string
}> {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  // Bumps all resources for the logged-in user's facility to current timestamp
  const { error } = await supabase
    .from("facility_resources")
    .update({
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("facility_id", user.facility_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/resources")
  revalidatePath("/dashboard/facilities")
  return { success: true }
}
