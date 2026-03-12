"use client";

import { useUser } from "@/hooks/useUser";

/**
 * Returns the current user's village_id and lab_id for scoping data queries.
 * Admins get `null` for both (see all data), other roles are scoped.
 */
export function useVillageScope() {
  const { profile } = useUser();

  const isAdmin = profile?.role === "admin";

  return {
    villageId: isAdmin ? null : (profile?.village_id ?? null),
    labId: isAdmin ? null : (profile?.lab_id ?? null),
    isAdmin,
  };
}
