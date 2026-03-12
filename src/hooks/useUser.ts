"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type UserProfile =
  Database["public"]["Tables"]["user_profiles"]["Row"];

/**
 * Fetches and returns the current authenticated user's profile row
 * from the user_profiles table. Re-fetches when auth state changes.
 */
export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { profile, loading, error };
}
