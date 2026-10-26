"use server"

import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { isValidTransition, type ReferralStatus } from "@/lib/constants/referral-status"
import type { ReferralInsert } from "@/lib/types/database"

export async function createReferralAction(formData: FormData) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const patientName = formData.get("patient_name") as string
  const patientAge = formData.get("patient_age") as string
  const patientSex = formData.get("patient_sex") as string
  const patientAddress = formData.get("patient_address") as string
  const chiefComplaint = formData.get("chief_complaint") as string
  const reason = formData.get("reason") as string
  const requiredService = formData.get("required_service") as string
  const urgency = formData.get("urgency") as string
  const clinicalNotes = formData.get("clinical_notes") as string
  const receivingFacilityId = formData.get("receiving_facility_id") as string
  const recommendationRunId = (formData.get("recommendation_run_id") as string) || null

  // Validation
  if (!patientName || !chiefComplaint || !receivingFacilityId || !urgency) {
    return { error: "Patient name, chief complaint, urgency, and receiving facility are required" }
  }

  if (receivingFacilityId === user.facility_id) {
    return { error: "Cannot refer to your own facility" }
  }

  const supabase = await createClient()

  // Create the referral
  const { data: referral, error: refError } = await supabase
    .from("referrals")
    .insert({
      patient_name: patientName,
      patient_age: patientAge ? parseInt(patientAge) : null,
      patient_sex: patientSex || null,
      patient_address: patientAddress || null,
      chief_complaint: chiefComplaint,
      reason: reason || null,
      required_service: requiredService || null,
      urgency: urgency as "ROUTINE" | "URGENT" | "EMERGENCY",
      clinical_notes: clinicalNotes || null,
      referring_facility_id: user.facility_id,
      receiving_facility_id: receivingFacilityId,
      recommendation_run_id: recommendationRunId,
      status: "PENDING",
      created_by: user.id,
    })
    .select("id")
    .single()

  if (refError) {
    return { error: refError.message }
  }

  // Create CREATED event
  await supabase.from("referral_events").insert({
    referral_id: referral.id,
    event_type: "CREATED",
    new_status: "PENDING",
    notes: `Referral created for ${requiredService || "general care"}`,
    actor_id: user.id,
  })

  redirect(`/dashboard/referrals/${referral.id}`)
}

export async function updateReferralStatusAction(
  referralId: string,
  newStatus: ReferralStatus,
  notes?: string
) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  // Fetch current referral
  const { data: referral, error: fetchError } = await supabase
    .from("referrals")
    .select("*")
    .eq("id", referralId)
    .single()

  if (fetchError || !referral) {
    return { error: "Referral not found" }
  }

  // Validate transition
  if (!isValidTransition(referral.status as ReferralStatus, newStatus)) {
    return {
      error: `Invalid transition from ${referral.status} to ${newStatus}`,
    }
  }

  // Validate authorization
  const isReceiver = referral.receiving_facility_id === user.facility_id
  const isSender = referral.referring_facility_id === user.facility_id

  // Only receiver can acknowledge, accept, decline, complete
  if (
    ["ACKNOWLEDGED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"].includes(newStatus) &&
    !isReceiver
  ) {
    return { error: "Only the receiving facility can perform this action" }
  }

  // Only sender can cancel a PENDING referral
  if (newStatus === "CANCELLED" && !isSender && !isReceiver) {
    return { error: "Not authorized to cancel this referral" }
  }

  // Map status to event type
  const eventType = newStatus as string

  // Update referral status
  const { error: updateError } = await supabase
    .from("referrals")
    .update({ status: newStatus })
    .eq("id", referralId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Create event
  await supabase.from("referral_events").insert({
    referral_id: referralId,
    event_type: eventType,
    previous_status: referral.status,
    new_status: newStatus,
    notes: notes || null,
    actor_id: user.id,
  })

  return { success: true }
}

export async function redirectReferralAction(
  referralId: string,
  newReceivingFacilityId: string,
  reason: string
) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  // Fetch current referral
  const { data: referral, error: fetchError } = await supabase
    .from("referrals")
    .select("*")
    .eq("id", referralId)
    .single()

  if (fetchError || !referral) {
    return { error: "Referral not found" }
  }

  // Only receiver can redirect
  if (referral.receiving_facility_id !== user.facility_id) {
    return { error: "Only the receiving facility can redirect this referral" }
  }

  // Can only redirect active referrals
  if (!["PENDING", "ACKNOWLEDGED"].includes(referral.status)) {
    return { error: "Can only redirect PENDING or ACKNOWLEDGED referrals" }
  }

  if (newReceivingFacilityId === referral.referring_facility_id) {
    return { error: "Cannot redirect back to the referring facility" }
  }

  const previousReceivingId = referral.receiving_facility_id

  // Update referral: new receiver, reset to PENDING
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      receiving_facility_id: newReceivingFacilityId,
      status: "PENDING",
    })
    .eq("id", referralId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Create REDIRECTED event
  await supabase.from("referral_events").insert({
    referral_id: referralId,
    event_type: "REDIRECTED",
    previous_status: referral.status,
    new_status: "PENDING",
    previous_receiving_facility_id: previousReceivingId,
    new_receiving_facility_id: newReceivingFacilityId,
    notes: reason,
    actor_id: user.id,
  })

  return { success: true }
}

export async function addNoteAction(referralId: string, notes: string) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  // Verify user has access to this referral
  const { data: referral } = await supabase
    .from("referrals")
    .select("referring_facility_id, receiving_facility_id, status")
    .eq("id", referralId)
    .single()

  if (!referral) {
    return { error: "Referral not found" }
  }

  const hasAccess =
    referral.referring_facility_id === user.facility_id ||
    referral.receiving_facility_id === user.facility_id

  if (!hasAccess) {
    return { error: "Not authorized to add notes to this referral" }
  }

  await supabase.from("referral_events").insert({
    referral_id: referralId,
    event_type: "NOTE_ADDED",
    previous_status: referral.status,
    new_status: referral.status,
    notes,
    actor_id: user.id,
  })

  return { success: true }
}
