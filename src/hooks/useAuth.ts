"use client";

import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/**
 * Hook providing Supabase auth state (session, user) and helpers.
 * Subscribe to onAuthStateChange so the component re-renders on login/logout.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
    });

    // Subscribe to changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, user: session?.user ?? null, loading: false });
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  return { ...state, signOut };
}
