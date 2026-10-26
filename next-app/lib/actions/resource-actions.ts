"use server"

import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import type { ResourceStatus } from "@/lib/types/database"

export async function updateResourceAction(
  resourceId: string,
  status: ResourceStatus,
  quantity?: number | null
) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("facility_resources")
    .update({
      status,
      quantity: quantity ?? null,
      updated_by: user.id,
    })
    .eq("id", resourceId)
    .eq("facility_id", user.facility_id) // RLS + extra check

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/resources")
  return { success: true }
}

export async function addResourceAction(formData: FormData) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const resourceName = formData.get("resource_name") as string
  const resourceCategory = formData.get("resource_category") as string
  const status = formData.get("status") as ResourceStatus
  const quantityStr = formData.get("quantity") as string
  const description = formData.get("description") as string

  if (!resourceName || !status) {
    return { error: "Resource name and status are required" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("facility_resources").insert({
    facility_id: user.facility_id,
    resource_name: resourceName,
    resource_category: resourceCategory || null,
    status,
    quantity: quantityStr ? parseInt(quantityStr) : null,
    description: description || null,
    updated_by: user.id,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "A resource with this name already exists" }
    }
    return { error: error.message }
  }

  revalidatePath("/dashboard/resources")
  return { success: true }
}

export async function deleteResourceAction(resourceId: string) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    return { error: "Not authorized" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("facility_resources")
    .delete()
    .eq("id", resourceId)
    .eq("facility_id", user.facility_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/resources")
  return { success: true }
}
