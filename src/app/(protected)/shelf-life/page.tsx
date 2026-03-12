"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useVillageScope } from "@/hooks/useVillageScope";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { CalendarClock, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/types/database.types";

type ExtensionStatus = Database["public"]["Enums"]["extension_status"];

interface Lot {
  id: string;
  lot_number: string;
  expiry_date: string | null;
  item_master: { name: string; unit: string } | null;
}

interface Extension {
  id: string;
  lot_id: string;
  old_expiry_date: string;
  new_expiry_date: string;
  reason: string;
  status: ExtensionStatus;
  reject_reason: string | null;
  created_at: string;
  review_date: string | null;
  item_lots: (Lot & { villages: { name: string } | null }) | null;
  requester: { full_name: string } | null;
  approver: { full_name: string } | null;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function ShelfLifePage() {
  const { profile, loading: profileLoading } = useUser();
  const { canAccess } = usePermissions();
  const { villageId } = useVillageScope();
  const { toasts, toast, remove } = useToast();

  const isApprover = canAccess("/admin/users"); // admin or focal_point

  const [lots, setLots] = useState<Lot[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ lot_id: "", new_expiry_date: "", reason: "" });

  // Approve/reject modal
  const [actionTarget, setActionTarget] = useState<Extension | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionMode, setActionMode] = useState<"approve" | "reject" | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Load lots that have an expiry date
    let lotsQ = supabase
      .from("item_lots")
      .select("id, lot_number, expiry_date, item_master(name, unit)")
      .eq("status", "active")
      .not("expiry_date", "is", null)
      .order("expiry_date");
    if (villageId) lotsQ = lotsQ.eq("village_id", villageId);
    const { data: lotsData } = await lotsQ;
    setLots((lotsData ?? []) as any);

    // Load extensions
    const { data: extData } = await supabase
      .from("shelf_life_extensions")
      .select(
        "*, item_lots(id, lot_number, expiry_date, item_master(name, unit), villages(name)), requester:user_profiles!shelf_life_extensions_requested_by_fkey(full_name), approver:user_profiles!shelf_life_extensions_approved_by_fkey(full_name)"
      )
      .order("created_at", { ascending: false });
    setExtensions((extData ?? []) as any);

    setLoading(false);
  }, [villageId]);

  useEffect(() => { load(); }, [load]);

  const selectedLot = lots.find((l) => l.id === form.lot_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedLot) return;
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const { data: ext, error: extErr } = await supabase
      .from("shelf_life_extensions")
      .insert({
        lot_id: form.lot_id,
        requested_by: profile.id,
        old_expiry_date: selectedLot.expiry_date!,
        new_expiry_date: form.new_expiry_date,
        reason: form.reason,
        status: "pending",
      })
      .select()
      .single();

    if (extErr) { setError(extErr.message); setSaving(false); return; }

    await supabase.from("transactions").insert({
      type: "shelf_life_extension",
      reference_id: ext.id,
      reference_type: "shelf_life_extensions",
      description: `Shelf life extension requested for Lot ${selectedLot.lot_number}`,
      user_id: profile.auth_user_id,
      village_id: villageId ?? undefined,
    });

    toast("success", "Extension request submitted");
    setForm({ lot_id: "", new_expiry_date: "", reason: "" });
    load();
    setSaving(false);
  }

  async function handleApprove() {
    if (!profile || !actionTarget) return;
    setActionSaving(true);
    const supabase = createClient();

    // Approve the extension
    await supabase.from("shelf_life_extensions").update({
      status: "approved",
      approved_by: profile.id,
      review_date: new Date().toISOString().split("T")[0],
    }).eq("id", actionTarget.id);

    // Update the lot expiry date
    await supabase.from("item_lots").update({
      expiry_date: actionTarget.new_expiry_date,
    }).eq("id", actionTarget.lot_id);

    toast("success", "Extension approved — lot expiry date updated");
    setActionTarget(null);
    setActionMode(null);
    load();
    setActionSaving(false);
  }

  async function handleReject() {
    if (!profile || !actionTarget || !rejectReason.trim()) return;
    setActionSaving(true);
    const supabase = createClient();

    await supabase.from("shelf_life_extensions").update({
      status: "rejected",
      approved_by: profile.id,
      reject_reason: rejectReason,
      review_date: new Date().toISOString().split("T")[0],
    }).eq("id", actionTarget.id);

    toast("error", "Extension rejected");
    setActionTarget(null);
    setActionMode(null);
    setRejectReason("");
    load();
    setActionSaving(false);
  }

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.key === "all" ? extensions.length : extensions.filter((e) => e.status === t.key).length,
  }));

  const filtered = extensions.filter((e) => activeTab === "all" || e.status === activeTab);

  const columns: Column<Extension>[] = [
    {
      key: "item",
      header: "Item / Lot",
      render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
            {(r.item_lots as any)?.item_master?.name ?? "—"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Lot: {(r.item_lots as any)?.lot_number ?? "—"} · {(r.item_lots as any)?.villages?.name ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Expiry Change",
      render: (r) => (
        <div className="text-xs space-y-0.5">
          <p style={{ color: "var(--color-text-muted)" }}>
            From: <span className="line-through">{format(new Date(r.old_expiry_date), "dd MMM yyyy")}</span>
          </p>
          <p style={{ color: "var(--color-success)" }}>
            To: {format(new Date(r.new_expiry_date), "dd MMM yyyy")}
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{r.reason}</span>,
    },
    {
      key: "requester",
      header: "Requested By",
      render: (r) => <span className="text-sm">{(r.requester as any)?.full_name ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const v = r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning";
        return <Badge variant={v}>{r.status}</Badge>;
      },
    },
    {
      key: "created_at",
      header: "Requested",
      sortable: true,
      render: (r) => (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {format(new Date(r.created_at), "dd MMM yyyy")}
        </span>
      ),
    },
    ...(isApprover
      ? [{
          key: "actions" as keyof Extension,
          header: "",
          render: (r: Extension) => r.status === "pending" ? (
            <div className="flex gap-2">
              <Button size="sm" variant="success" onClick={() => { setActionTarget(r); setActionMode("approve"); }}>
                <CheckCircle size={13} /> Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => { setActionTarget(r); setActionMode("reject"); }}>
                <XCircle size={13} /> Reject
              </Button>
            </div>
          ) : null,
        }]
      : []),
  ];

  if (profileLoading || loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <CalendarClock size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Shelf Life Extension</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Request and manage expiry date extensions for active lots
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Request Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="New Extension Request" subtitle="Request a shelf life extension for a lot" />
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Select
                label="Lot *"
                required
                value={form.lot_id}
                onChange={(e) => setForm((f) => ({ ...f, lot_id: e.target.value }))}
                options={lots.map((l) => ({
                  value: l.id,
                  label: `${(l.item_master as any)?.name} — Lot ${l.lot_number}`,
                }))}
                placeholder="Select a lot…"
              />

              {selectedLot && (
                <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span className="font-medium">Current expiry:</span>{" "}
                    {selectedLot.expiry_date
                      ? format(new Date(selectedLot.expiry_date), "dd MMM yyyy")
                      : "No expiry set"}
                  </p>
                </div>
              )}

              <Input
                label="New Expiry Date *"
                type="date"
                required
                value={form.new_expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, new_expiry_date: e.target.value }))}
                min={selectedLot?.expiry_date ?? undefined}
              />
              <Textarea
                label="Reason *"
                required
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Provide justification for the extension…"
                rows={3}
              />
              <Button
                type="submit"
                loading={saving}
                disabled={!form.lot_id || !form.new_expiry_date || !form.reason}
                className="w-full"
              >
                <Clock size={15} /> Submit Request
              </Button>
            </form>
          </Card>
        </div>

        {/* Table */}
        <div className="lg:col-span-3">
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <CardHeader title="Extension Requests" subtitle={`${extensions.length} total`} />
              <div className="mt-3">
                <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
              </div>
            </div>
            <DataTable
              columns={columns}
              data={filtered}
              keyFn={(r) => r.id}
              emptyState={
                <EmptyState
                  title="No requests found"
                  description="Submit an extension request using the form."
                  icon={<CalendarClock size={32} />}
                />
              }
            />
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        open={actionMode === "approve" && !!actionTarget}
        onClose={() => { setActionTarget(null); setActionMode(null); }}
        title="Approve Extension"
        size="sm"
      >
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Approve the shelf life extension for lot{" "}
          <strong>{(actionTarget?.item_lots as any)?.lot_number}</strong>?
          The lot expiry date will be updated to{" "}
          <strong>
            {actionTarget ? format(new Date(actionTarget.new_expiry_date), "dd MMM yyyy") : ""}
          </strong>.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => { setActionTarget(null); setActionMode(null); }}>Cancel</Button>
          <Button loading={actionSaving} onClick={handleApprove}>
            <CheckCircle size={14} /> Approve
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={actionMode === "reject" && !!actionTarget}
        onClose={() => { setActionTarget(null); setActionMode(null); setRejectReason(""); }}
        title="Reject Extension"
        size="sm"
      >
        <Textarea
          label="Rejection reason *"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Explain why this extension is rejected…"
          rows={3}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => { setActionTarget(null); setActionMode(null); setRejectReason(""); }}>Cancel</Button>
          <Button variant="danger" loading={actionSaving} disabled={!rejectReason.trim()} onClick={handleReject}>
            <XCircle size={14} /> Reject
          </Button>
        </div>
      </Modal>
    </div>
  );
}
