"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ShoppingCart } from "lucide-react";

export default function NewOrderPage() {
  const { profile, loading: profileLoading } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    item_id: "", quantity: "", unit: "", purpose: "", notes: "",
  });

  useEffect(() => {
    createClient().from("item_master").select("*").eq("is_active", true).order("name").then(({ data }) => setItems(data ?? []));
  }, []);

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })); }

  useEffect(() => {
    const item = items.find(i => i.id === form.item_id);
    if (item) set("unit", item.unit);
  }, [form.item_id, items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null); setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("purchase_orders").insert({
      item_id: form.item_id,
      quantity: Number(form.quantity),
      unit: form.unit,
      purpose: form.purpose || null,
      notes: form.notes || null,
      village_id: profile.village_id!,
      lab_id: profile.lab_id!,
      requester_id: profile.id,
      status: "pending",
    });
    if (err) { setError(err.message); setSaving(false); return; }

    // Log transaction
    await supabase.from("transactions").insert({
      type: "order_created",
      reference_id: form.item_id,
      reference_type: "purchase_orders",
      description: `Order created: ${items.find(i => i.id === form.item_id)?.name} x${form.quantity}`,
      user_id: profile.auth_user_id,
      village_id: profile.village_id,
    });
    router.push("/orders");
  }

  if (profileLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <ShoppingCart size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>New Order Request</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {profile?.villages ? (profile as any).villages?.name : ""} · {profile?.labs ? (profile as any).labs?.name : ""}
          </p>
        </div>
      </div>

      <Card>
        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Chemical / Item *"
            required
            value={form.item_id}
            onChange={e => set("item_id", e.target.value)}
            options={items.map(i => ({ value: i.id, label: `${i.name}${i.cas_number ? ` (CAS ${i.cas_number})` : ""}` }))}
            placeholder="Select an item…"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity *" type="number" min="0.001" step="any" required value={form.quantity} onChange={e => set("quantity", e.target.value)} />
            <Input label="Unit *" required value={form.unit} onChange={e => set("unit", e.target.value)} hint="Auto-filled from item" />
          </div>
          <Textarea label="Purpose / Justification" value={form.purpose} onChange={e => set("purpose", e.target.value)} rows={3} />
          <Textarea label="Additional notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => router.push("/orders")}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!form.item_id || !form.quantity}>Submit Order</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
