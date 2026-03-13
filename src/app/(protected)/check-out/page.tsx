"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVillageScope } from "@/hooks/useVillageScope";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Minus } from "lucide-react";
import { format } from "date-fns";

// ── Types ───────────────────────────────────────────────────────────────────

interface ActiveLot {
  id: string;
  lot_number: string;
  remaining_quantity: number;
  received_quantity: number;
  unit: string;
  expiry_date: string | null;
  village_id: string;
  item_master: { name: string; unit: string } | null;
  villages: { name: string } | null;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StockProgressBar({ remaining, total }: { remaining: number; total: number }) {
  const pct   = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const color = pct > 50 ? "var(--color-success)" : pct > 20 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
        <span>Remaining: {remaining}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function CheckOutPage() {
  const { profile, loading: profileLoading } = useUser();
  const { villageId } = useVillageScope();

  const [lots, setLots]       = useState<ActiveLot[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const { toasts, toast, remove } = useToast();
  const [form, setForm] = useState({ lot_id: "", quantity: "", purpose: "" });

  // Performance fix: extracting the load query into a useCallback ensures
  // (a) the same function reference is used on initial load and post-submit
  //     refresh, and (b) villageId is always applied — the previous ad-hoc
  //     inline refresh query on line 82 of the original file omitted the
  //     village_id filter, exposing lots from all villages to non-admin users.
  const loadLots = useCallback(async () => {
    const supabase = createClient();

    // Select only the columns the page actually renders — avoids SELECT *
    let q = supabase
      .from("item_lots")
      // The FEFO (First-Expiry-First-Out) ordering is enforced DB-side here;
      // the new idx_item_lots_active_expiry partial index covers this exactly.
      .select("id, lot_number, remaining_quantity, received_quantity, unit, expiry_date, village_id, item_master(name, unit), villages(name)")
      .eq("status", "active")
      .gt("remaining_quantity", 0)
      .order("expiry_date", { ascending: true, nullsFirst: false });

    // Always apply village scope — this was missing from the original refresh
    if (villageId) q = q.eq("village_id", villageId);

    const { data } = await q;
    setLots((data ?? []) as ActiveLot[]);
  }, [villageId]);

  useEffect(() => { loadLots(); }, [loadLots]);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  const selectedLot = lots.find((l) => l.id === form.lot_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedLot) return;

    const qty = Number(form.quantity);
    if (qty > selectedLot.remaining_quantity) {
      setError(`Cannot check out more than remaining quantity (${selectedLot.remaining_quantity}).`);
      return;
    }

    setError(null);
    setSaving(true);
    const supabase = createClient();

    const { data: checkoutId, error: rpcErr } = await supabase.rpc("perform_checkout", {
      p_lot_id:   form.lot_id,
      p_quantity: qty,
      p_user_id:  profile.auth_user_id,
      p_purpose:  form.purpose || undefined,
    });

    if (rpcErr) { setError(rpcErr.message); setSaving(false); return; }

    await supabase.from("transactions").insert({
      type:           "check_out",
      reference_id:   checkoutId,
      reference_type: "checkouts",
      description:    `Check-out: ${qty} ${selectedLot.item_master?.unit} of ${selectedLot.item_master?.name} (Lot ${selectedLot.lot_number})`,
      user_id:        profile.auth_user_id,
      village_id:     selectedLot.village_id,
    });

    toast("success", `Checked out ${qty} ${selectedLot.item_master?.unit} successfully!`);
    setForm({ lot_id: "", quantity: "", purpose: "" });

    // Refresh using the same scoped query — village_id is always applied
    loadLots();
    setSaving(false);
  }

  if (profileLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-danger-bg)" }}>
          <Minus size={20} style={{ color: "var(--color-danger)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Check-out</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Consume from an active lot</p>
        </div>
      </div>

      <Card>
        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Lot *"
            required
            value={form.lot_id}
            onChange={(e) => set("lot_id", e.target.value)}
            options={lots.map((l) => ({
              value: l.id,
              label: `${l.item_master?.name} — Lot ${l.lot_number} (${l.remaining_quantity} ${l.item_master?.unit} left)`,
            }))}
            placeholder="Select active lot…"
          />

          {selectedLot && (
            <div className="space-y-2 rounded-lg px-4 py-3" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {selectedLot.item_master?.name}
              </p>
              <StockProgressBar remaining={selectedLot.remaining_quantity} total={selectedLot.received_quantity} />
              {selectedLot.expiry_date && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Expires: {format(new Date(selectedLot.expiry_date), "dd MMM yyyy")}
                </p>
              )}
            </div>
          )}

          <Input
            label="Quantity *"
            type="number"
            step="any"
            min="0.001"
            max={selectedLot?.remaining_quantity ?? undefined}
            required
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
          />
          <Textarea label="Purpose" value={form.purpose} onChange={(e) => set("purpose", e.target.value)} rows={2} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" loading={saving} disabled={!form.lot_id || !form.quantity}>
              Confirm Check-out
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
