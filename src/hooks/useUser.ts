"use client";

/**
 * useUser — backward-compatible hook.
 *
 * Performance fix: instead of each component maintaining its own Supabase
 * auth.getUser() + user_profiles fetch, this hook now reads from the shared
 * UserContext that is populated once by UserProvider in the protected layout.
 *
 * All existing callers (TopNav, OrdersPage, ApprovalsPage, NotificationBell,
 * usePermissions, useVillageScope) continue to work without any changes.
 */
export { useUserContext as useUser, type UserProfile } from "@/contexts/UserContext";
