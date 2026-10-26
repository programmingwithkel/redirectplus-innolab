import { createClient } from "@/lib/supabase/server"
import type { Profile, Facility, ProfileWithFacility } from "@/lib/types/database"

/**
 * Get the currently authenticated user's profile with facility data.
 * Use this in Server Components and Server Actions.
 * Returns null if not authenticated or profile not found.
 */
export async function getUser(): Promise<ProfileWithFacility | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      facility:facilities(*)
    `
    )
    .eq("id", user.id)
    .single()

  if (!profile) return null

  return profile as unknown as ProfileWithFacility
}

/**
 * Get the currently authenticated user's profile (without facility).
 * Lighter query when facility data is not needed.
 */
export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile as Profile | null
}

/**
 * Require authentication — throws redirect if not authenticated.
 * Use in Server Components that absolutely require a logged-in user.
 */
export async function requireUser(): Promise<ProfileWithFacility> {
  const user = await getUser()
  if (!user) {
    // This will be caught by proxy.ts and redirected to /login
    throw new Error("Not authenticated")
  }
  return user
}

/**
 * Require super_admin role — throws if not admin.
 */
export async function requireAdmin(): Promise<ProfileWithFacility> {
  const user = await requireUser()
  if (user.role !== "super_admin") {
    throw new Error("Not authorized — super_admin required")
  }
  return user
}

/**
 * Require operational role with a facility — throws if not operational.
 */
export async function requireOperational(): Promise<ProfileWithFacility> {
  const user = await requireUser()
  if (user.role !== "operational" || !user.facility_id) {
    throw new Error("Not authorized — operational user with facility required")
  }
  return user
}
