import { createClient } from "@supabase/supabase-js"

// Admin client bypasses RLS — use ONLY on the server for admin operations
// Never import this in client components or expose the service role key
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
