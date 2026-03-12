"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { Plus, Package } from "lucide-react";
import type { Database } from "@/types/database.types";

type Item = Database["public"]["Tables"]["item_master"]["Row"];

const CATEGORY_OPTIONS = [
  { value: "chemical_reagent", label: "Chemical Reagent" },
  { value: "calibration_std", label: "Calibration Standard" },
  { value: "gas", label: "Gas" },
  { value: "material_supply", label: "Material Supply" },
  { value: "peroxide", label: "Peroxide" },
];

const CATEGORY_LABELS: Record<string, string> = {
  chemical_reagent: "Chemical Reagent",
  calibration_std: "Calibration Std",
  gas: "Gas",
  material_supply: "Material Supply",
  peroxide: "Peroxide",
};

const columns: Column<Item>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (r) => (
      <div>
        <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>{r.name}</p>
        {r.cas_number && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>CAS {r.cas_number}</p>}
      </div>
    ),
  },
  {
    key: "category",
    header: "Category",
    render: (r) => <Badge variant="info">{CATEGORY_LABELS[r.category] ?? r.category}</Badge>,
  },
  { key: "unit", header: "Unit", render: (r) => <span className="text-sm">{r.unit}</span> },
  {
    key: "flags",
    header: "Flags",
    render: (r) => (
      <div className="flex gap-1 flex-wrap">
        {r.is_peroxide && <Badge variant="danger">Peroxide</Badge>}
        {r.is_regulated && <Badge variant="warning">Regulated</Badge>}
      </div>
    ),
  },
  {
    key: "is_active",
    header: "Status",
    render: (r) => (
      <Badge variant={r.is_active ? "success" : "muted"}>{r.is_active ? "Active" : "Inactive"}</Badge>
    ),
  },
];

const DEFAULT_FORM = {
  name: "", cas_number: "", category: "chemical_reagent", unit: "mL",
  is_peroxide: false, is_regulated: false, min_stock_level: "", storage_requirements: "", is_active: true,
};

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const { toasts, toast, remove } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.from("item_master").select("*").order("name");
    if (err) setError(err.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("item_master").insert({
      name: form.name,
      cas_number: form.cas_number || null,
      category: form.category as Item["category"],
      unit: form.unit,
      is_peroxide: form.is_peroxide,
      is_regulated: form.is_regulated,
      min_stock_level: form.min_stock_level ? Number(form.min_stock_level) : null,
      storage_requirements: form.storage_requirements || null,
      is_active: form.is_active,
    });
    if (err) {
      toast("error", err.message);
    } else {
      toast("success", "Item created!");
      setModalOpen(false);
      setForm(DEFAULT_FORM);
      load();
    }
    setSaving(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
            <Package size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Item Catalog</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{items.length} items registered</p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />New Item
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card padding={false}>
        <DataTable columns={columns} data={items} keyFn={(r) => r.id} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Item" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Item name *" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CAS Number" value={form.cas_number} onChange={(e) => set("cas_number", e.target.value)} />
            <Input label="Unit *" required value={form.unit} onChange={(e) => set("unit", e.target.value)} hint="e.g. mL, g, pcs" />
          </div>
          <Select
            label="Category *"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <Input
            label="Minimum stock level"
            type="number"
            min="0"
            value={form.min_stock_level}
            onChange={(e) => set("min_stock_level", e.target.value)}
          />
          <Textarea label="Storage requirements" value={form.storage_requirements} onChange={(e) => set("storage_requirements", e.target.value)} />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
              <input type="checkbox" checked={form.is_peroxide} onChange={(e) => set("is_peroxide", e.target.checked)} />
              Peroxide item
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
              <input type="checkbox" checked={form.is_regulated} onChange={(e) => set("is_regulated", e.target.checked)} />
              Regulated substance
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
