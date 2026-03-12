import { createClient } from "@/lib/supabase/client";

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  village_id: string;
  lab_id: string;
  requested_role?: string;
}

/** Sign in with email + password. */
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/** Register a new user. The DB trigger creates the user_profiles row. */
export async function signUp(payload: SignUpData) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.full_name,
        village_id: payload.village_id,
        lab_id: payload.lab_id,
        requested_role: payload.requested_role ?? null,
      },
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

/** Sign the current user out. */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get the currently active session (browser-side). */
export async function getSession() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
