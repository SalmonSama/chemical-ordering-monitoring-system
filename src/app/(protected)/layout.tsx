/**
 * Protected route group layout.
 * Wraps all authenticated pages with the full AppLayout (sidebar + topnav).
 * Full implementation (auth guard check + AppLayout) in Step 6.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO (Step 6): Wrap with <AppLayout> which includes Sidebar + TopNav.
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-alt)" }}>
      {children}
    </div>
  );
}
