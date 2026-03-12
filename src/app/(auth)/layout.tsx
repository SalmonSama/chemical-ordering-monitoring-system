/**
 * Auth route group layout — centered, no sidebar.
 * Used for: /login, /register, /pending-approval
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-alt)] p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
