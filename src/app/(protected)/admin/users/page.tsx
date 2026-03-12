"use client";

import { useState, useEffect, useCallback } from "react";
import { UserTable } from "@/components/admin/UserTable";
import { PendingUsersQueue } from "@/components/admin/PendingUsersQueue";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { createClient } from "@/lib/supabase/client";
import { Users, AlertCircle } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("user_profiles")
      .select("*, villages(name), labs(name)")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setUsers(data ?? []);
      setPending((data ?? []).filter((u: any) => u.status === "pending"));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-brand-100)" }}
        >
          <Users size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            User Management
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Approve new accounts and manage user roles
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Pending queue */}
      {pending.length > 0 && (
        <Card>
          <CardHeader
            title={`Pending Accounts (${pending.length})`}
            subtitle="Review and approve or reject new registrations"
            action={
              <span
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--color-warning)" }}
              >
                <AlertCircle size={12} />
                Action required
              </span>
            }
          />
          <PendingUsersQueue users={pending} onAction={load} />
        </Card>
      )}

      {/* All users table */}
      <Card padding={false}>
        <div className="px-5 pt-5 pb-3">
          <CardHeader title="All Users" subtitle={`${users.length} total accounts`} />
        </div>
        <UserTable users={users} />
      </Card>
    </div>
  );
}
