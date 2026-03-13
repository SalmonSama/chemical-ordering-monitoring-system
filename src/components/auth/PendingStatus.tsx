"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import { signOut } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { Clock, XCircle, LogOut } from "lucide-react";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export function PendingStatus() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>
        Loading…
      </div>
    );
  }

  const isRejected = profile?.status === "rejected";

  return (
    <div className="text-center space-y-5">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{
          background: isRejected
            ? "var(--color-danger-bg)"
            : "var(--color-warning-bg)",
        }}
      >
        {isRejected ? (
          <XCircle
            size={32}
            style={{ color: "var(--color-danger)" }}
          />
        ) : (
          <Clock
            size={32}
            style={{ color: "var(--color-warning)" }}
          />
        )}
      </div>

      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {isRejected ? "Account Not Approved" : "Awaiting Approval"}
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {isRejected
            ? "Your account registration was not approved. Please contact your lab administrator for assistance."
            : "Your account has been created and is pending approval by an administrator. You will gain access once your account is approved."}
        </p>
      </div>

      {profile && (
        <div
          className="rounded-lg px-4 py-3 text-left text-sm space-y-1"
          style={{
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-medium">Name:</span> {profile.full_name}
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-medium">Email:</span> {profile.email}
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-medium">Status:</span>{" "}
            <span
              style={{
                color: isRejected
                  ? "var(--color-danger)"
                  : "var(--color-warning)",
                fontWeight: 600,
              }}
            >
              {isRejected ? "Rejected" : "Pending Review"}
            </span>
          </p>
        </div>
      )}

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 mx-auto text-sm font-medium px-4 py-2 rounded-lg transition-base"
        style={{
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  );
}
