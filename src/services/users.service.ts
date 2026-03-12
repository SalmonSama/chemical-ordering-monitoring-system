import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

/** Fetch all user profiles, joined with village and lab names. */
export async function fetchUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, villages(name), labs(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch all pending users. */
export async function fetchPendingUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, villages(name), labs(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
