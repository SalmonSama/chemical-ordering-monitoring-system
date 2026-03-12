"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVillageScope } from "@/hooks/useVillageScope";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { PackagePlus } from "lucide-react";
import { format } from "date-fns";

export default function CheckInPage() {
  const { profile, loading: profileLoading } = useUser();
  const { villageId } = useVillageScope();
  const [approvedPOs, setApprovedPOs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toasts, toast, remove } = useToast();
  const [form, setForm] = useState({
    purchase_order_id: "", lot_number: "", received_quantity: "",
    manufacture_date: "", expiry_date: "", supplier: "",
  });

  const loadPOs = useCallback(async () => {
    const supabase = createClient();
    let q = supabase.from("purchase_orders")
      .select("*, item_master(name, unit, is_peroxide), villages(name)")
      .in("status", ["approved", "ordered", "partially_received"])
      .order("created_at", { ascending: false });
    if (villageId) q = q.eq("village_id", villageId);
    const { data } = await q;
    setApprovedPOs(data ?? []);
  }, [villageId]);

  useEffect(() => { loadPOs(); }, [loadPOs]);

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })); }

  const selectedPO = approvedPOs.find(p => p.id === form.purchase_order_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedPO) return;
    setError(null); setSaving(true);
    const supabase = createClient();
    const qty = Number(form.received_quantity);
    const { data: lot, error: lotErr } = await supabase.from("item_lots").insert({
      purchase_order_id: form.purchase_order_id,
      item_id: selectedPO.item_id,
      village_id: selectedPO.village_id,
      lab_id: selectedPO.lab_id,
      lot_number: form.lot_number,
      received_quantity: qty,
      remaining_quantity: qty,
      unit: (selectedPO.item_master as any)?.unit ?? "",
      manufacture_date: form.manufacture_date || null,
      expiry_date: form.expiry_date || null,
      received_date: format(new Date(), "yyyy-MM-dd"),
      received_by: profile.id,
      supplier: form.supplier || null,
      is_peroxide: (selectedPO.item_master as any)?.is_peroxide ?? false,
      status: "active",
    }).select().single();

    if (lotErr) { setError(lotErr.message); setSaving(false); return; }

    // Update PO to received
    await supabase.from("purchase_orders").update({ status: "received" }).eq("id", form.purchase_order_id);

    // Transaction log
    await supabase.from("transactions").insert({
      type: "check_in", reference_id: lot.id, reference_type: "item_lots",
      description: `Check-in: ${qty} ${(selectedPO.item_master as any)?.unit} (Lot ${form.lot_number})`,
      user_id: profile.auth_user_id, village_id: selectedPO.village_id,
    });

    toast("success", `Lot ${form.lot_number} checked in successfully!`);
    setForm({ purchase_order_id: "", lot_number: "", received_quantity: "", manufacture_date: "", expiry_date: "", supplier: "" });
    loadPOs();
    setSaving(false);
  }

  if (profileLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <PackagePlus size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Check-in</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Receive items against an approved purchase order</p>
        </div>
      </div>
      <Card>
        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Purchase Order *"
            required
            value={form.purchase_order_id}
            onChange={e => set("purchase_order_id", e.target.value)}
            options={approvedPOs.map(p => ({
              value: p.id,
              label: `${p.po_number ?? "No PO#"} — ${(p.item_master as any)?.name} x${p.quantity} (${(p.villages as any)?.name})`,
            }))}
            placeholder="Select approved PO…"
          />
          {selectedPO && (
            <div className="rounded-lg px-4 py-3 text-sm space-y-1" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
              <p style={{ color: "var(--color-text-secondary)" }}><span className="font-medium">Item:</span> {(selectedPO.item_master as any)?.name}</p>
              <p style={{ color: "var(--color-text-secondary)" }}><span className="font-medium">Ordered:</span> {selectedPO.quantity} {(selectedPO.item_master as any)?.unit}</p>
              <p style={{ color: "var(--color-text-secondary)" }}><span className="font-medium">Village:</span> {(selectedPO.villages as any)?.name}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lot Number *" required value={form.lot_number} onChange={e => set("lot_number", e.target.value)} placeholder="e.g. LOT-2024-001" />
            <Input label="Received Quantity *" type="number" step="any" min="0.001" required value={form.received_quantity} onChange={e => set("received_quantity", e.target.value)} />
          </div>
          <Input label="Supplier" value={form.supplier} onChange={e => set("supplier", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Manufacture Date" type="date" value={form.manufacture_date} onChange={e => set("manufacture_date", e.target.value)} />
            <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" loading={saving} disabled={!form.purchase_order_id || !form.lot_number || !form.received_quantity}>
              Confirm Check-in
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
