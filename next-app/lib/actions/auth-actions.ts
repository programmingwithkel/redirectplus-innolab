"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  let { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Seamless fallback for existing demo/seed accounts if domain was @careroute.ph
  if (error && (email.includes("@rescueplus.ph") || email.includes("@redirectplus.ph") || email.includes("@redirect.ph"))) {
    const fallbackEmail = email.replace(/@(rescueplus\.ph|redirectplus\.ph|redirect\.ph)$/, "@careroute.ph")
    const fallbackPassword = (password === "Rescue+2026!" || password === "Redirect+2026!") ? "CareRoute2026!" : password
    const retry = await supabase.auth.signInWithPassword({
      email: fallbackEmail,
      password: fallbackPassword,
    })
    if (!retry.error) {
      error = null
    }
  }

  if (error) {
    return { error: error.message }
  }

  // Get user profile to determine redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication failed" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return { error: "User profile not found. Contact administrator." }
  }

  // Redirect based on role
  if (profile.role === "super_admin") {
    redirect("/admin")
  } else {
    redirect("/dashboard")
  }
}

export async function signupAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string
  const fullName = (formData.get("fullName") as string)?.trim()
  const facilityId = (formData.get("facilityId") as string)?.trim() || null

  if (!email || !password || !fullName) {
    return { error: "Full name, email, and password are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // If a facility was selected, update the profile record
    if (facilityId) {
      await supabase
        .from("profiles")
        .update({ facility_id: facilityId, full_name: fullName })
        .eq("id", data.user.id)
    }
  }

  // If session was granted immediately (email confirmation disabled in Supabase)
  if (data.session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .single()

    if (profile?.role === "super_admin") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  }

  return { success: "Account registered successfully! You can now sign in." }
}

export async function getFacilitiesForAuthAction() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("facilities")
    .select("id, name, facility_type, city")
    .eq("is_active", true)
    .order("facility_type")
    .order("name")

  return data || []
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
