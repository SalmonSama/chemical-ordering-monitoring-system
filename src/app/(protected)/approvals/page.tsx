"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVillageScope } from "@/hooks/useVillageScope";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { format } from "date-fns";
import { CheckSquare, UserCheck, XCircle } from "lucide-react";

export default function ApprovalsPage() {
  const { profile } = useUser();
  const { villageId } = useVillageScope();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toasts, toast, remove } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("purchase_orders")
      .select("*, item_master(name, unit), villages(name, code), requester:user_profiles!purchase_orders_requester_id_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (villageId) q = q.eq("village_id", villageId);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setOrders(data ?? []);
    setLoading(false);
  }, [villageId]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(orderId: string) {
    if (!profile) return;
    setActionLoading(true);
    const supabase = createClient();
    const order = orders.find(o => o.id === orderId);
    const villageCode = (order?.villages as any)?.code ?? "LAB";
    const year = new Date().getFullYear();
    const { data: poNumber, error: poErr } = await supabase.rpc("generate_po_number", { p_village_code: villageCode, p_year: year });
    if (poErr) { toast("error", poErr.message); setActionLoading(false); return; }
    const { error: updateErr } = await supabase.from("purchase_orders").update({
      status: "approved", po_number: poNumber,
      approved_by: profile.auth_user_id, approved_at: new Date().toISOString(),
    }).eq("id", orderId);
    if (updateErr) { toast("error", updateErr.message); } else {
      await supabase.from("transactions").insert({
        type: "order_approved", reference_id: orderId, reference_type: "purchase_orders",
        description: `Order ${poNumber} approved`, user_id: profile.auth_user_id, village_id: order?.village_id,
      });
      toast("success", `Approved! PO: ${poNumber}`);
      load();
    }
    setActionLoading(false);
  }

  async function handleReject() {
    if (!profile || !rejectReason.trim()) return;
    setActionLoading(true);
    const supabase = createClient();
    const order = orders.find(o => o.id === rejectModal.orderId);
    const { error: updateErr } = await supabase.from("purchase_orders").update({
      status: "rejected", reject_reason: rejectReason,
      approved_by: profile.auth_user_id, approved_at: new Date().toISOString(),
    }).eq("id", rejectModal.orderId);
    if (updateErr) { toast("error", updateErr.message); } else {
      await supabase.from("transactions").insert({
        type: "order_rejected", reference_id: rejectModal.orderId, reference_type: "purchase_orders",
        description: `Order rejected: ${rejectReason}`, user_id: profile.auth_user_id, village_id: order?.village_id,
      });
      toast("success", "Order rejected.");
      setRejectModal({ open: false, orderId: "" });
      setRejectReason("");
      load();
    }
    setActionLoading(false);
  }

  const columns: Column<any>[] = [
    {
      key: "item", header: "Item",
      render: r => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>{(r.item_master as any)?.name}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.quantity} {(r.item_master as any)?.unit}</p>
        </div>
      ),
    },
    { key: "village", header: "Village", render: r => <span className="text-sm">{(r.villages as any)?.name ?? "—"}</span> },
    { key: "requester", header: "Requester", render: r => <span className="text-sm">{(r.requester as any)?.full_name ?? "—"}</span> },
    { key: "purpose", header: "Purpose", render: r => <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{r.purpose ?? "—"}</span> },
    {
      key: "created_at", header: "Requested", sortable: true,
      render: r => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{format(new Date(r.created_at), "dd MMM yyyy")}</span>,
    },
    {
      key: "actions", header: "",
      render: r => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="primary" loading={actionLoading} onClick={() => handleApprove(r.id)}>
            <UserCheck size={12} />Approve
          </Button>
          <Button size="sm" variant="danger" loading={actionLoading} onClick={() => { setRejectModal({ open: true, orderId: r.id }); setRejectReason(""); }}>
            <XCircle size={12} />Reject
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <CheckSquare size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Approvals Queue</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{orders.length} pending order{orders.length !== 1 ? "s" : ""} awaiting review</p>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <Card padding={false}>
        <DataTable
          columns={columns}
          data={orders}
          keyFn={r => r.id}
          emptyState={<EmptyState title="No pending approvals" description="All orders have been reviewed." icon={<CheckSquare size={24} style={{ color: "var(--color-success)" }} />} />}
        />
      </Card>
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, orderId: "" })} title="Reject Order" size="sm">
        <div className="space-y-4">
          <Textarea label="Reason for rejection *" required value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, orderId: "" })}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject} disabled={!rejectReason.trim()}>Reject Order</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
