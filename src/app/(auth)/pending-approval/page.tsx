import type { Metadata } from "next";
import { PendingStatus } from "@/components/auth/PendingStatus";

export const metadata: Metadata = { title: "Pending Approval" };

export default function PendingApprovalPage() {
  return (
    <div
      className="rounded-2xl shadow-xl p-8 animate-fade-in"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <PendingStatus />
    </div>
  );
}
