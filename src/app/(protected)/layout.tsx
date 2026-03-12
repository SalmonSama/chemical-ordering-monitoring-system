"use client";

import { AppLayout } from "@/components/layout/AppLayout";

/**
 * Protected route group layout.
 * Wraps all authenticated pages with the full AppLayout (sidebar + topnav).
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
