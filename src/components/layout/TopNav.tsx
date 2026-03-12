"use client";

import { useUser } from "@/hooks/useUser";
import { signOut } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ChevronDown, User } from "lucide-react";
import { useState } from "react";
import { Badge, statusVariant } from "@/components/ui/Badge";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  requester: "Requester",
  focal_point: "Focal Point",
  staff: "Staff",
  compliance: "Compliance",
};

export function TopNav() {
  const { profile } = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0"
      style={{
        background: "var(--color-surface-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Left: Page title injected by children via document.title, or just a brand mark */}
      <div />

      {/* Right: notification bell + user menu */}
      <div className="flex items-center gap-3">
        {/* Notification bell (placeholder) */}
        <button
          className="relative p-2 rounded-lg transition-base"
          style={{ color: "var(--color-text-muted)" }}
          title="Notifications (coming in Phase 3)"
        >
          <Bell size={18} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-base"
            style={{
              background: "var(--color-surface-alt)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "var(--color-brand-600)",
                color: "#fff",
              }}
            >
              <User size={14} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-none" style={{ color: "var(--color-text-primary)" }}>
                {profile?.full_name ?? "…"}
              </p>
              {profile?.role && (
                <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </p>
              )}
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl z-20 py-1 animate-fade-in"
                style={{
                  background: "var(--color-surface-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {profile && (
                  <div
                    className="px-4 py-2.5"
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {profile.full_name}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {profile.email}
                    </p>
                    {profile.role && (
                      <div className="mt-1.5">
                        <Badge variant={statusVariant(profile.status)}>
                          {profile.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-base"
                  style={{ color: "var(--color-danger)" }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
