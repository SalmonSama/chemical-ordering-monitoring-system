"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVillageScope } from "@/hooks/useVillageScope";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { FileText, Plus, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/types/database.types";

type RegulatoryStatus = Database["public"]["Enums"]["regulatory_status"];

interface RegulatoryRecord {
  id: string;
  item_id: string;
  regulation_type: string;
  regulation_code: string | null;
  description: string | null;
  status: RegulatoryStatus;
  effective_date: string | null;
  expiry_date: string | null;
  is_controlled: boolean;
  village_id: string | null;
  item_master: { name: string } | null;
  villages: { name: string } | null;
  regulatory_record_lots: { id: string; lot_id: string; item_lots: { lot_number: string } | null }[];
}

const REGULATION_TYPES = [
  { value: "import_permit",         label: "Import Permit" },
  { value: "disposal_license",      label: "Disposal License" },
  { value: "safety_data_sheet",     label: "Safety Data Sheet" },
  { value: "controlled_substance",  label: "Controlled Substance" },
  { value: "hazardous_material",    label: "Hazardous Material" },
  { value: "other",                 label: "Other" },
];

const STATUS_OPTIONS: { value: RegulatoryStatus; label: string }[] = [
  { value: "active",         label: "Active" },
  { value: "pending_review", label: "Pending Review" },
  { value: "expired",        label: "Expired" },
];

const DEFAULT_FORM = {
  item_id: "",
  regulation_type: "import_permit",
  regulation_code: "",
  description: "",
  status: "active" as RegulatoryStatus,
  effective_date: "",
  expiry_date: "",
  is_controlled: false,
  lot_ids: [] as string[],
};

export default function RegulatoryPage() {
  const { profile, loading: profileLoading } = useUser();
  const { villageId } = useVillageScope();
  const { toasts, toast, remove } = useToast();

  const [records, setRecords] = useState<RegulatoryRecord[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [lots, setLots] = useState<{ id: string; lot_number: string; item_master: { name: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [recRes, itemsRes, lotsRes] = await Promise.all([
      supabase
        .from("regulatory_records")
        .select("*, item_master(name), villages(name), regulatory_record_lots(id, lot_id, item_lots(lot_number))")
        .order("created_at", { ascending: false }),
      supabase.from("item_master").select("id, name").eq("is_regulated", true).order("name"),
      supabase.from("item_lots").select("id, lot_number, item_master(name)").eq("status", "active"),
    ]);

    setRecords((recRes.data ?? []) as any);
    setItems(itemsRes.data ?? []);
    setLots((lotsRes.data ?? []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(key: string, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  function toggleLot(lotId: string) {
    setForm((f) => ({
      ...f,
      lot_ids: f.lot_ids.includes(lotId)
        ? f.lot_ids.filter((id) => id !== lotId)
        : [...f.lot_ids, lotId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const { data: rec, error: recErr } = await supabase
      .from("regulatory_records")
      .insert({
        item_id: form.item_id,
        regulation_type: form.regulation_type,
        regulation_code: form.regulation_code || null,
        description: form.description || null,
        status: form.status,
        effective_date: form.effective_date || null,
        expiry_date: form.expiry_date || null,
        is_controlled: form.is_controlled,
        village_id: villageId ?? null,
      })
      .select()
      .single();

    if (recErr) { setError(recErr.message); setSaving(false); return; }

    // Link lots
    if (form.lot_ids.length > 0) {
      await supabase.from("regulatory_record_lots").insert(
        form.lot_ids.map((lot_id) => ({ regulatory_record_id: rec.id, lot_id }))
      );
    }

    // Transaction
    await supabase.from("transactions").insert({
      type: "regulatory_update",
      reference_id: rec.id,
      reference_type: "regulatory_records",
      description: `Regulatory record created: ${form.regulation_type} — ${form.regulation_code || "No code"}`,
      user_id: profile.auth_user_id,
      village_id: villageId ?? undefined,
    });

    toast("success", "Regulatory record created");
    setModalOpen(false);
    setForm(DEFAULT_FORM);
    load();
    setSaving(false);
  }

  async function updateStatus(id: string, status: RegulatoryStatus) {
    const supabase = createClient();
    const { error: err } = await supabase.from("regulatory_records").update({ status }).eq("id", id);
    if (err) toast("error", err.message);
    else { toast("success", "Status updated"); load(); }
  }

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.item_master as any)?.name?.toLowerCase().includes(q) ||
      r.regulation_code?.toLowerCase().includes(q) ||
      r.regulation_type.toLowerCase().includes(q)
    );
  });

  const columns: Column<RegulatoryRecord>[] = [
    {
      key: "item",
      header: "Item",
      render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
            {(r.item_master as any)?.name ?? "—"}
          </p>
          {r.is_controlled && <Badge variant="danger" className="mt-1">Controlled</Badge>}
        </div>
      ),
    },
    {
      key: "regulation",
      header: "Regulation",
      render: (r) => (
        <div>
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            {REGULATION_TYPES.find((t) => t.value === r.regulation_type)?.label ?? r.regulation_type}
          </p>
          {r.regulation_code && (
            <p className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{r.regulation_code}</p>
          )}
        </div>
      ),
    },
    {
      key: "lots",
      header: "Lots",
      render: (r) => (
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <LinkIcon size={12} />
          {(r.regulatory_record_lots as any[])?.length ?? 0} lot(s)
        </div>
      ),
    },
    {
      key: "effective_date",
      header: "Dates",
      render: (r) => (
        <div className="text-xs space-y-0.5">
          {r.effective_date && (
            <p style={{ color: "var(--color-text-muted)" }}>
              Eff: {format(new Date(r.effective_date), "dd MMM yyyy")}
            </p>
          )}
          {r.expiry_date && (
            <p style={{ color: "var(--color-text-muted)" }}>
              Exp: {format(new Date(r.expiry_date), "dd MMM yyyy")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => updateStatus(r.id, e.target.value as RegulatoryStatus)}
          className="text-xs px-2 py-1.5 rounded-lg font-medium"
          style={{
            background: r.status === "active" ? "var(--color-success-bg)" : r.status === "expired" ? "var(--color-danger-bg)" : "var(--color-warning-bg)",
            color: r.status === "active" ? "var(--color-success)" : r.status === "expired" ? "var(--color-danger)" : "var(--color-warning)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      ),
    },
    {
      key: "village",
      header: "Village",
      render: (r) => <span className="text-sm">{(r.villages as any)?.name ?? "All"}</span>,
    },
  ];

  if (profileLoading || loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
            <FileText size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Regulatory Records</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {records.length} records · {records.filter((r) => r.status === "active").length} active
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by item, code…" className="w-64" />
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Record
          </Button>
        </div>
      </div>

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={filtered}
          keyFn={(r) => r.id}
          emptyState={
            <EmptyState
              title="No regulatory records"
              description="Create your first record using the button above."
              icon={<FileText size={32} />}
            />
          }
        />
      </Card>

      {/* New Record Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Regulatory Record" size="lg">
        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Regulated Item *"
            required
            value={form.item_id}
            onChange={(e) => set("item_id", e.target.value)}
            options={items.map((i) => ({ value: i.id, label: i.name }))}
            placeholder="Select a regulated item…"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Regulation Type *"
              required
              value={form.regulation_type}
              onChange={(e) => set("regulation_type", e.target.value)}
              options={REGULATION_TYPES}
            />
            <Input
              label="Regulation Code / Reference"
              value={form.regulation_code}
              onChange={(e) => set("regulation_code", e.target.value)}
              placeholder="e.g. BKN/2024/0042"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Effective Date" type="date" value={form.effective_date} onChange={(e) => set("effective_date", e.target.value)} />
            <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as RegulatoryStatus)}
            options={STATUS_OPTIONS}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Additional context or notes…"
            rows={2}
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
            <input type="checkbox" checked={form.is_controlled} onChange={(e) => set("is_controlled", e.target.checked)} />
            Controlled substance
          </label>

          {/* Lot Linking */}
          {lots.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                Link Lots <span className="font-normal text-xs" style={{ color: "var(--color-text-muted)" }}>(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded-lg p-2" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-alt)" }}>
                {lots.map((lot) => (
                  <label key={lot.id} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={form.lot_ids.includes(lot.id)}
                      onChange={() => toggleLot(lot.id)}
                    />
                    {(lot.item_master as any)?.name} — {lot.lot_number}
                  </label>
                ))}
              </div>
              {form.lot_ids.length > 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--color-brand-600)" }}>
                  {form.lot_ids.length} lot(s) selected
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!form.item_id}>
              Create Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
