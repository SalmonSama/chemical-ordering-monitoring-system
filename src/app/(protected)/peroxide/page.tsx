"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVillageScope } from "@/hooks/useVillageScope";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { FlaskConical, ShieldAlert, AlertTriangle, CheckCircle, Beaker } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/types/database.types";

type InspectionStatus = Database["public"]["Enums"]["inspection_status"];

interface PeroxideLot {
  id: string;
  lot_number: string;
  remaining_quantity: number;
  unit: string;
  status: string;
  item_master: { name: string } | null;
  villages: { name: string } | null;
}

interface Inspection {
  id: string;
  ppm_reading: number;
  status: InspectionStatus;
  inspection_date: string;
  notes: string | null;
  action_taken: string | null;
  lot_id: string;
  item_lots: {
    lot_number: string;
    item_master: { name: string } | null;
  } | null;
  inspector: { full_name: string } | null;
}

interface PPMThresholds {
  warning: number;
  quarantine: number;
}

const STATUS_COLORS: Record<InspectionStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  normal:     { color: "var(--color-success)",  bg: "var(--color-success-bg)",  icon: <CheckCircle size={20} /> },
  warning:    { color: "var(--color-warning)",  bg: "var(--color-warning-bg)",  icon: <AlertTriangle size={20} /> },
  quarantine: { color: "var(--color-danger)",   bg: "var(--color-danger-bg)",   icon: <ShieldAlert size={20} /> },
};

function classifyPPM(ppm: number, thresholds: PPMThresholds): InspectionStatus {
  if (ppm >= thresholds.quarantine) return "quarantine";
  if (ppm >= thresholds.warning)    return "warning";
  return "normal";
}

export default function PeroxidePage() {
  const { profile, loading: profileLoading } = useUser();
  const { villageId } = useVillageScope();
  const { toasts, toast, remove } = useToast();

  const [lots, setLots] = useState<PeroxideLot[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [thresholds, setThresholds] = useState<PPMThresholds>({ warning: 30, quarantine: 100 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quarantining, setQuarantining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    lot_id: "",
    ppm_reading: "",
    notes: "",
    action_taken: "",
  });
  const [previewStatus, setPreviewStatus] = useState<InspectionStatus | null>(null);

  // Reject modal
  const [quarantineTargetId, setQuarantineTargetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Load PPM thresholds from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["ppm_threshold_warning", "ppm_threshold_quarantine"]);

    if (settings) {
      const warn = settings.find((s) => s.key === "ppm_threshold_warning");
      const quar = settings.find((s) => s.key === "ppm_threshold_quarantine");
      setThresholds({
        warning:    warn  ? (warn.value  as any).value : 30,
        quarantine: quar  ? (quar.value  as any).value : 100,
      });
    }

    // Load peroxide lots
    let lotsQ = supabase
      .from("item_lots")
      .select("id, lot_number, remaining_quantity, unit, status, item_master(name), villages(name)")
      .eq("is_peroxide", true)
      .in("status", ["active", "quarantined"])
      .order("created_at", { ascending: false });
    if (villageId) lotsQ = lotsQ.eq("village_id", villageId);
    const { data: lotsData } = await lotsQ;
    setLots((lotsData ?? []) as any);

    // Load inspection history
    const { data: inspData } = await supabase
      .from("peroxide_inspections")
      .select("*, item_lots(lot_number, item_master(name)), inspector:user_profiles!peroxide_inspections_inspector_id_fkey(full_name)")
      .order("inspection_date", { ascending: false })
      .limit(50);
    setInspections((inspData ?? []) as any);

    setLoading(false);
  }, [villageId]);

  useEffect(() => { load(); }, [load]);

  // Auto-classify PPM on input
  function handlePPMChange(val: string) {
    setForm((f) => ({ ...f, ppm_reading: val }));
    const ppm = parseFloat(val);
    if (!isNaN(ppm)) setPreviewStatus(classifyPPM(ppm, thresholds));
    else setPreviewStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !form.lot_id || !form.ppm_reading) return;
    setError(null);
    setSaving(true);

    const ppm = parseFloat(form.ppm_reading);
    const status = classifyPPM(ppm, thresholds);
    const supabase = createClient();

    const { data: insp, error: inspErr } = await supabase
      .from("peroxide_inspections")
      .insert({
        lot_id: form.lot_id,
        inspector_id: profile.id,
        ppm_reading: ppm,
        status,
        inspection_date: format(new Date(), "yyyy-MM-dd"),
        notes: form.notes || null,
        action_taken: form.action_taken || null,
      })
      .select()
      .single();

    if (inspErr) { setError(inspErr.message); setSaving(false); return; }

    // Log transaction
    await supabase.from("transactions").insert({
      type: "inspection",
      reference_id: insp.id,
      reference_type: "peroxide_inspections",
      description: `Peroxide inspection: ${ppm} PPM (${status})`,
      user_id: profile.auth_user_id,
      village_id: villageId ?? undefined,
    });

    toast("success", `Inspection recorded — Status: ${status.toUpperCase()}`);
    setForm({ lot_id: "", ppm_reading: "", notes: "", action_taken: "" });
    setPreviewStatus(null);
    load();
    setSaving(false);
  }

  async function handleQuarantine(lotId: string) {
    setQuarantining(lotId);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("item_lots")
      .update({ status: "quarantined" })
      .eq("id", lotId);

    if (err) toast("error", err.message);
    else { toast("warning", "Lot quarantined"); load(); }
    setQuarantining(null);
    setQuarantineTargetId(null);
  }

  // Compute summary stats from inspections array (most recent per lot)
  const latestByLot = new Map<string, InspectionStatus>();
  for (const insp of inspections) {
    if (!latestByLot.has(insp.lot_id)) latestByLot.set(insp.lot_id, insp.status);
  }
  const statusCounts = { normal: 0, warning: 0, quarantine: 0 };
  latestByLot.forEach((s) => { statusCounts[s]++; });

  const columns: Column<Inspection>[] = [
    {
      key: "item",
      header: "Item / Lot",
      render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
            {(r.item_lots as any)?.item_master?.name ?? "—"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Lot: {(r.item_lots as any)?.lot_number ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "ppm_reading",
      header: "PPM Reading",
      sortable: true,
      render: (r) => (
        <span className="font-mono font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
          {r.ppm_reading} ppm
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const v = r.status === "normal" ? "success" : r.status === "warning" ? "warning" : "danger";
        return <Badge variant={v}>{r.status}</Badge>;
      },
    },
    {
      key: "inspector",
      header: "Inspector",
      render: (r) => <span className="text-sm">{(r.inspector as any)?.full_name ?? "—"}</span>,
    },
    {
      key: "inspection_date",
      header: "Date",
      sortable: true,
      render: (r) => (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {format(new Date(r.inspection_date), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (r) => (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {r.notes ?? "—"}
        </span>
      ),
    },
  ];

  if (profileLoading || loading) return <PageLoader />;

  const selectedLot = lots.find((l) => l.id === form.lot_id);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-danger-bg)" }}>
          <FlaskConical size={20} style={{ color: "var(--color-danger)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Peroxide Monitor</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Track PPM levels · Warning ≥{thresholds.warning} ppm · Quarantine ≥{thresholds.quarantine} ppm
          </p>
        </div>
      </div>

      {/* Status Tiles */}
      <div className="grid grid-cols-3 gap-4">
        {(["normal", "warning", "quarantine"] as InspectionStatus[]).map((s) => {
          const cfg = STATUS_COLORS[s];
          return (
            <div
              key={s}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}
            >
              <div style={{ color: cfg.color }}>{cfg.icon}</div>
              <div>
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{statusCounts[s]}</p>
                <p className="text-xs font-medium capitalize" style={{ color: cfg.color }}>{s}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lots needing attention */}
      {lots.filter((l) => l.status === "quarantined").length > 0 && (
        <Card>
          <CardHeader
            title="Quarantined Lots"
            subtitle="These lots have been quarantined and should not be used"
          />
          <div className="space-y-2 mt-3">
            {lots
              .filter((l) => l.status === "quarantined")
              .map((lot) => (
                <div
                  key={lot.id}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)30" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {(lot.item_master as any)?.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Lot {lot.lot_number} · {lot.remaining_quantity} {lot.unit} remaining · {(lot.villages as any)?.name}
                    </p>
                  </div>
                  <Badge variant="danger">Quarantined</Badge>
                </div>
              ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inspection Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Record Inspection" subtitle="Log a new PPM reading" />
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Select
                label="Peroxide Lot *"
                required
                value={form.lot_id}
                onChange={(e) => setForm((f) => ({ ...f, lot_id: e.target.value }))}
                options={lots.map((l) => ({
                  value: l.id,
                  label: `${(l.item_master as any)?.name} — Lot ${l.lot_number}`,
                }))}
                placeholder="Select a peroxide lot…"
              />

              {selectedLot && (
                <div className="rounded-lg px-3 py-2.5 text-xs space-y-1" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span className="font-medium">Remaining:</span> {selectedLot.remaining_quantity} {selectedLot.unit}
                  </p>
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span className="font-medium">Village:</span> {(selectedLot.villages as any)?.name}
                  </p>
                </div>
              )}

              <div>
                <Input
                  label="PPM Reading *"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={form.ppm_reading}
                  onChange={(e) => handlePPMChange(e.target.value)}
                  placeholder="e.g. 45.5"
                />
                {previewStatus && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Auto-classified:</span>
                    <Badge variant={previewStatus === "normal" ? "success" : previewStatus === "warning" ? "warning" : "danger"}>
                      {previewStatus.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>

              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observations, conditions…"
                rows={2}
              />
              <Textarea
                label="Action Taken"
                value={form.action_taken}
                onChange={(e) => setForm((f) => ({ ...f, action_taken: e.target.value }))}
                placeholder="Any immediate actions taken…"
                rows={2}
              />

              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  loading={saving}
                  disabled={!form.lot_id || !form.ppm_reading}
                  className="flex-1"
                >
                  <Beaker size={15} /> Record
                </Button>
                {form.lot_id && (
                  <Button
                    type="button"
                    variant="danger"
                    loading={quarantining === form.lot_id}
                    onClick={() => setQuarantineTargetId(form.lot_id)}
                  >
                    <ShieldAlert size={15} /> Quarantine Lot
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* Inspection History */}
        <div className="lg:col-span-3">
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <CardHeader title="Inspection History" subtitle={`${inspections.length} records`} />
            </div>
            <DataTable
              columns={columns}
              data={inspections}
              keyFn={(r) => r.id}
              emptyState={
                <EmptyState
                  title="No inspections yet"
                  description="Record your first PPM reading using the form."
                  icon={<FlaskConical size={32} />}
                />
              }
            />
          </Card>
        </div>
      </div>

      {/* Quarantine Confirm Modal */}
      <Modal
        open={!!quarantineTargetId}
        onClose={() => setQuarantineTargetId(null)}
        title="Confirm Quarantine"
        size="sm"
      >
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Are you sure you want to quarantine this lot? It will be marked as unavailable for use.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setQuarantineTargetId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={!!quarantining}
            onClick={() => quarantineTargetId && handleQuarantine(quarantineTargetId)}
          >
            <ShieldAlert size={14} /> Quarantine
          </Button>
        </div>
      </Modal>
    </div>
  );
}
