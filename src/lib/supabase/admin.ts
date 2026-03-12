import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Supabase admin client (service role) — bypasses RLS.
 * ONLY use in server-side code (API routes, server actions).
 * NEVER expose this client or its key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      // Disable automatic token refresh — this client is purely server-side.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
