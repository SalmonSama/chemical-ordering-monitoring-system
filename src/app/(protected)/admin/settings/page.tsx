"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Settings, Save, FlaskConical, FileText } from "lucide-react";

interface Setting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
}

export default function AdminSettingsPage() {
  const { toasts, toast, remove } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PPM thresholds form
  const [ppmWarning, setPpmWarning] = useState("30");
  const [ppmQuarantine, setPpmQuarantine] = useState("100");
  const [ppmSaving, setPpmSaving] = useState(false);

  // PO format form
  const [poPrefix, setPoPrefix] = useState("PO");
  const [poSeparator, setPoSeparator] = useState("-");
  const [poSaving, setPoSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.from("system_settings").select("key, value, description");
    if (err) { setError(err.message); setLoading(false); return; }

    const s = (data ?? []) as Setting[];
    setSettings(s);

    const warn = s.find((x) => x.key === "ppm_threshold_warning");
    const quar = s.find((x) => x.key === "ppm_threshold_quarantine");
    const po   = s.find((x) => x.key === "po_number_format");
    if (warn) setPpmWarning(String((warn.value as any).value ?? 30));
    if (quar) setPpmQuarantine(String((quar.value as any).value ?? 100));
    if (po)   { setPoPrefix((po.value as any).prefix ?? "PO"); setPoSeparator((po.value as any).separator ?? "-"); }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function savePPM(e: React.FormEvent) {
    e.preventDefault();
    setPpmSaving(true);
    setError(null);
    const supabase = createClient();
    const warn = parseFloat(ppmWarning);
    const quar = parseFloat(ppmQuarantine);
    if (quar <= warn) { setError("Quarantine threshold must be greater than warning threshold."); setPpmSaving(false); return; }

    await Promise.all([
      supabase.from("system_settings").update({ value: { value: warn } }).eq("key", "ppm_threshold_warning"),
      supabase.from("system_settings").update({ value: { value: quar } }).eq("key", "ppm_threshold_quarantine"),
    ]);
    toast("success", "PPM thresholds saved");
    setPpmSaving(false);
  }

  async function savePOFormat(e: React.FormEvent) {
    e.preventDefault();
    setPoSaving(true);
    const supabase = createClient();
    await supabase.from("system_settings").update({
      value: { prefix: poPrefix.trim(), separator: poSeparator.trim() || "-" },
    }).eq("key", "po_number_format");
    toast("success", "PO format saved");
    setPoSaving(false);
  }

  if (loading) return <PageLoader />;

  const poPreview = `${poPrefix}${poSeparator}AIE${poSeparator}2026${poSeparator}0042`;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <Settings size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>System Settings</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Configure global system parameters</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* PPM Thresholds */}
      <Card>
        <CardHeader
          title="Peroxide PPM Thresholds"
          subtitle="Set the PPM levels that trigger Warning and Quarantine statuses during inspections"
          action={<FlaskConical size={18} style={{ color: "var(--color-danger)" }} />}
        />
        <form onSubmit={savePPM} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Warning Threshold (ppm)"
              type="number"
              step="0.1"
              min="0"
              required
              value={ppmWarning}
              onChange={(e) => setPpmWarning(e.target.value)}
              hint="PPM ≥ this value = Warning"
            />
            <Input
              label="Quarantine Threshold (ppm)"
              type="number"
              step="0.1"
              min="0"
              required
              value={ppmQuarantine}
              onChange={(e) => setPpmQuarantine(e.target.value)}
              hint="PPM ≥ this value = Quarantine"
            />
          </div>

          {/* Visual scale */}
          <div className="rounded-lg p-3 text-xs space-y-1.5" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
            <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>Classification preview:</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-success)" }} />
              <span style={{ color: "var(--color-text-muted)" }}>Normal: 0 – {parseFloat(ppmWarning) - 0.1} ppm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-warning)" }} />
              <span style={{ color: "var(--color-text-muted)" }}>Warning: {ppmWarning} – {parseFloat(ppmQuarantine) - 0.1} ppm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-danger)" }} />
              <span style={{ color: "var(--color-text-muted)" }}>Quarantine: ≥ {ppmQuarantine} ppm</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={ppmSaving}>
              <Save size={15} /> Save Thresholds
            </Button>
          </div>
        </form>
      </Card>

      {/* PO Number Format */}
      <Card>
        <CardHeader
          title="PO Number Format"
          subtitle="Configure the purchase order number pattern"
          action={<FileText size={18} style={{ color: "var(--color-brand-600)" }} />}
        />
        <form onSubmit={savePOFormat} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prefix"
              value={poPrefix}
              onChange={(e) => setPoPrefix(e.target.value)}
              placeholder="e.g. PO"
            />
            <Input
              label="Separator"
              value={poSeparator}
              onChange={(e) => setPoSeparator(e.target.value)}
              placeholder="e.g. -"
              hint="Character between segments"
            />
          </div>
          <div className="rounded-lg px-4 py-3" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Preview:</p>
            <p className="font-mono text-sm font-semibold mt-0.5" style={{ color: "var(--color-text-primary)" }}>
              {poPreview}
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={poSaving}>
              <Save size={15} /> Save Format
            </Button>
          </div>
        </form>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader title="System Info" subtitle="Read-only system information" />
        <div className="mt-4 space-y-2">
          {[
            { label: "Application",  value: "ChemTrack — Chemical Ordering & Monitoring" },
            { label: "Version",      value: "1.0.0-mvp" },
            { label: "Region",       value: "ap-southeast-1 (Singapore)" },
            { label: "Database",     value: "PostgreSQL 17 via Supabase" },
            { label: "Environment",  value: process.env.NODE_ENV },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
