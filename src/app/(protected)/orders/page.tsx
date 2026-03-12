"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVillageScope } from "@/hooks/useVillageScope";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { format } from "date-fns";
import { CheckSquare, UserCheck, XCircle } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function OrdersPage() {
  const { profile } = useUser();
  const { villageId, isAdmin } = useVillageScope();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toasts, toast, remove } = useToast();
  const canApprove = profile?.role === "admin" || profile?.role === "focal_point";

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("purchase_orders")
      .select("*, item_master(name, unit), villages(name), requester:user_profiles!purchase_orders_requester_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (villageId) query = query.eq("village_id", villageId);
    if (!isAdmin && profile?.role === "requester") query = query.eq("requester_id", profile?.id ?? "");

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setOrders(data ?? []);
    setLoading(false);
  }, [villageId, isAdmin, profile]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(orderId: string) {
    if (!profile) return;
    setActionLoading(true);
    const supabase = createClient();
    const order = orders.find(o => o.id === orderId);
    const year = new Date().getFullYear();
    const { data: poNumber } = await supabase.rpc("generate_po_number", {
      village_code: (order?.villages as any)?.name?.slice(0, 3)?.toUpperCase() ?? "LAB",
      year,
    });
    await supabase.from("purchase_orders").update({
      status: "approved", po_number: poNumber,
      approved_by: profile.auth_user_id, approved_at: new Date().toISOString(),
    }).eq("id", orderId);
    toast("success", `Order approved! PO: ${poNumber}`);
    setActionLoading(false);
    load();
  }

  async function handleReject() {
    if (!profile || !rejectReason.trim()) return;
    setActionLoading(true);
    const supabase = createClient();
    await supabase.from("purchase_orders").update({
      status: "rejected", reject_reason: rejectReason,
      approved_by: profile.auth_user_id, approved_at: new Date().toISOString(),
    }).eq("id", rejectModal.orderId);
    toast("success", "Order rejected.");
    setRejectModal({ open: false, orderId: "" });
    setRejectReason("");
    setActionLoading(false);
    load();
  }

  const filtered = activeTab === "all" ? orders : orders.filter(o => o.status === activeTab);

  const tabCounts = STATUS_TABS.map(t => ({
    ...t,
    count: t.key === "all" ? orders.length : orders.filter(o => o.status === t.key).length,
  }));

  const columns: Column<any>[] = [
    {
      key: "po_number", header: "PO #",
      render: r => <span className="font-mono text-xs" style={{ color: r.po_number ? "var(--color-brand-600)" : "var(--color-text-muted)" }}>{r.po_number ?? "—"}</span>,
    },
    {
      key: "item", header: "Item",
      render: r => <div><p className="font-medium text-sm">{(r.item_master as any)?.name}</p><p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.quantity} {(r.item_master as any)?.unit}</p></div>,
    },
    { key: "village", header: "Village", render: r => <span className="text-sm">{(r.villages as any)?.name ?? "—"}</span> },
    { key: "requester", header: "Requester", render: r => <span className="text-sm">{(r.requester as any)?.full_name ?? "—"}</span> },
    { key: "status", header: "Status", render: r => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
    { key: "created_at", header: "Date", sortable: true, render: r => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{format(new Date(r.created_at), "dd MMM yyyy")}</span> },
    ...(canApprove ? [{
      key: "actions", header: "",
      render: (r: any) => r.status === "pending" ? (
        <div className="flex gap-1.5">
          <Button size="sm" variant="primary" loading={actionLoading} onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }}>
            <UserCheck size={12} />Approve
          </Button>
          <Button size="sm" variant="danger" loading={actionLoading} onClick={(e) => { e.stopPropagation(); setRejectModal({ open: true, orderId: r.id }); setRejectReason(""); }}>
            <XCircle size={12} />Reject
          </Button>
        </div>
      ) : null,
    }] : []),
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
            <CheckSquare size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Orders</h1>
        </div>
        <a href="/orders/new">
          <Button>+ New Order</Button>
        </a>
      </div>
      {error && <ErrorBanner message={error} />}
      <Tabs tabs={tabCounts} active={activeTab} onChange={setActiveTab} />
      <Card padding={false}>
        <DataTable columns={columns} data={filtered} keyFn={r => r.id}
          emptyState={<EmptyState title="No orders found" description="No orders match this filter." />}
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
