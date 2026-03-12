"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { UserCheck, UserX, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ROLE_OPTIONS = [
  { value: "requester", label: "Requester" },
  { value: "staff", label: "Staff" },
  { value: "focal_point", label: "Focal Point" },
  { value: "compliance", label: "Compliance Officer" },
];

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  villages?: { name: string } | null;
  labs?: { name: string } | null;
}

interface PendingUsersQueueProps {
  users: PendingUser[];
  onAction: () => void;
}

export function PendingUsersQueue({ users, onAction }: PendingUsersQueueProps) {
  const [isPending, startTransition] = useTransition();
  const { toasts, toast, remove } = useToast();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  if (users.length === 0) {
    return (
      <div
        className="rounded-xl px-5 py-4 text-sm flex items-center gap-2"
        style={{
          background: "var(--color-success-bg)",
          border: "1px solid var(--color-success)",
          color: "var(--color-success)",
        }}
      >
        <UserCheck size={16} />
        No pending accounts — all caught up!
      </div>
    );
  }

  async function handleAction(userId: string, action: "approve" | "reject") {
    const role = selectedRoles[userId] ?? "requester";
    if (action === "approve" && !role) {
      toast("error", "Please select a role before approving.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, role }),
      });
      if (res.ok) {
        toast("success", action === "approve" ? "User approved!" : "User rejected.");
        onAction();
      } else {
        const err = await res.json();
        toast("error", err.error ?? "Action failed.");
      }
    });
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning)",
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                  {u.full_name}
                </span>
                <Badge variant="warning">
                  <Clock size={10} className="mr-1" />
                  Pending
                </Badge>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {u.email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {u.villages?.name ?? "—"} · {u.labs?.name ?? "—"} ·{" "}
                {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedRoles[u.id] ?? "requester"}
                onChange={(e) =>
                  setSelectedRoles((r) => ({ ...r, [u.id]: e.target.value }))
                }
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "var(--color-surface-card)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                {ROLE_OPTIONS.map((ro) => (
                  <option key={ro.value} value={ro.value}>{ro.label}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="primary"
                loading={isPending}
                onClick={() => handleAction(u.id, "approve")}
              >
                <UserCheck size={13} />
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={isPending}
                onClick={() => handleAction(u.id, "reject")}
              >
                <UserX size={13} />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
