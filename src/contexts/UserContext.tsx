"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type UserProfile =
  Database["public"]["Tables"]["user_profiles"]["Row"];

interface UserContextValue {
  /** The user_profiles row for the signed-in user, or null if loading / unauthenticated. */
  profile: UserProfile | null;
  /** True only during the initial fetch — consumers can render a skeleton. */
  loading: boolean;
  /** Non-null when the profile fetch failed. */
  error: string | null;
}

// --- Context --------------------------------------------------------------- //

const UserContext = createContext<UserContextValue | null>(null);

// --- Provider -------------------------------------------------------------- //

/**
 * UserProvider — mount this once, high up in the tree (e.g. the protected
 * layout).  It fetches the Supabase auth user + the user_profiles row a
 * single time, then re-fetches whenever the auth state changes.
 *
 * All child components that need the current user should call useUserContext()
 * (or the backward-compatible useUser()) instead of hitting Supabase
 * themselves.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProfile() {
      setLoading(true);
      setError(null);

      // getUser() makes a network call to Supabase Auth to validate the JWT,
      // but because this runs only inside UserProvider (one instance) instead
      // of in every component, we pay this cost exactly once per auth-state
      // change instead of N times per page load.
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error: profileErr } = await supabase
        .from("user_profiles")
        // Select all columns so the return type matches the full UserProfile
        // (Database["public"]["Tables"]["user_profiles"]["Row"]) including
        // approved_at, approved_by, and any future columns added to the schema.
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (profileErr) {
        setError(profileErr.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    // Initial load
    fetchProfile();

    // Re-fetch whenever the user signs in or out.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

// --- Consumption hook ------------------------------------------------------ //

/**
 * useUserContext — primary way to consume the shared UserContext.
 * Throws a clear error if used outside the provider tree so bugs are caught
 * at development time.
 */
export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === null) {
    throw new Error(
      "useUserContext() must be used inside a <UserProvider>. " +
        "Make sure UserProvider wraps your protected layout."
    );
  }
  return ctx;
}
