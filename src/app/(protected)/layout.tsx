"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { UserProvider } from "@/contexts/UserContext";

/**
 * Protected route group layout.
 * Wraps all authenticated pages with the full AppLayout (sidebar + topnav).
 *
 * Performance: UserProvider fetches the auth user + profile once here,
 * then shares it via context to all children (TopNav, pages, hooks).
 * This eliminates the N duplicate DB roundtrips that occurred when each
 * component called useUser() independently.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AppLayout>{children}</AppLayout>
    </UserProvider>
  );
}
