"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { Plus, Building2, ChevronRight } from "lucide-react";
import type { Database } from "@/types/database.types";

type Village = Database["public"]["Tables"]["villages"]["Row"];
type Lab = Database["public"]["Tables"]["labs"]["Row"];

export default function AdminVillagesPage() {
  const [villages, setVillages] = useState<(Village & { labs?: Lab[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [villageModal, setVillageModal] = useState(false);
  const [labModal, setLabModal] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [vForm, setVForm] = useState({ name: "", code: "", description: "" });
  const [lForm, setLForm] = useState({ name: "", code: "", location: "" });
  const [saving, setSaving] = useState(false);
  const { toasts, toast, remove } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: vs, error: ve } = await supabase.from("villages").select("*").order("name");
    if (ve) { setError(ve.message); setLoading(false); return; }
    const { data: ls } = await supabase.from("labs").select("*").order("name");
    const labsByVillage = (ls ?? []).reduce((acc: Record<string, Lab[]>, l) => {
      if (!l) return acc;
      if (!acc[l.village_id]) acc[l.village_id] = [];
      acc[l.village_id].push(l);
      return acc;
    }, {});
    setVillages((vs ?? []).filter(Boolean).map(v => ({ ...v, labs: labsByVillage[v?.id] ?? [] })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateVillage(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("villages").insert({ name: vForm.name, code: vForm.code.toUpperCase(), description: vForm.description || null });
    if (err) toast("error", err.message);
    else { toast("success", "Village created!"); setVillageModal(false); setVForm({ name: "", code: "", description: "" }); load(); }
    setSaving(false);
  }

  async function handleCreateLab(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("labs").insert({ name: lForm.name, code: lForm.code.toUpperCase(), village_id: selectedVillage?.id as string, location: lForm.location || null });
    if (err) toast("error", err.message);
    else { toast("success", "Lab created!"); setLabModal(false); setLForm({ name: "", code: "", location: "" }); load(); }
    setSaving(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
            <Building2 size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Villages &amp; Labs</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{villages.length} villages</p>
          </div>
        </div>
        <Button onClick={() => setVillageModal(true)}><Plus size={16} />New Village</Button>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-3">
        {villages.map(v => (
          <Card key={v?.id || Math.random()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{v?.name}
                  <span className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>{v?.code}</span>
                </p>
                {v.description && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{v.description}</p>}
              </div>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedVillage(v); setLabModal(true); }}>
                <Plus size={13} />Add Lab
              </Button>
            </div>
            <div className="space-y-1.5">
              {(v?.labs ?? []).length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No labs yet.</p>
              ) : (v?.labs ?? []).map(l => (
                <div key={l?.id || Math.random()} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: "var(--color-surface-alt)" }}>
                  <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />
                  <span style={{ color: "var(--color-text-primary)" }}>{l?.name}</span>
                  <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{l.code}</span>
                  {l.location && <span className="text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>{l.location}</span>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={villageModal} onClose={() => setVillageModal(false)} title="New Village" size="sm">
        <form onSubmit={handleCreateVillage} className="space-y-4">
          <Input label="Village name *" required value={vForm.name} onChange={e => setVForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Code *" required value={vForm.code} onChange={e => setVForm(f => ({ ...f, code: e.target.value }))} hint="Short code e.g. VLG1" />
          <Input label="Description" value={vForm.description} onChange={e => setVForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setVillageModal(false)}>Cancel</Button><Button type="submit" loading={saving}>Create</Button></div>
        </form>
      </Modal>
      <Modal open={labModal} onClose={() => setLabModal(false)} title={`Add Lab to ${selectedVillage?.name ?? ""}`} size="sm">
        <form onSubmit={handleCreateLab} className="space-y-4">
          <Input label="Lab name *" required value={lForm.name} onChange={e => setLForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Code *" required value={lForm.code} onChange={e => setLForm(f => ({ ...f, code: e.target.value }))} />
          <Input label="Location" value={lForm.location} onChange={e => setLForm(f => ({ ...f, location: e.target.value }))} />
          <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setLabModal(false)}>Cancel</Button><Button type="submit" loading={saving}>Add Lab</Button></div>
        </form>
      </Modal>
    </div>
  );
}
