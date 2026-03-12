"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVillageScope } from "@/hooks/useVillageScope";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { format, isAfter } from "date-fns";
import { Boxes } from "lucide-react";

function StockBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const color = pct > 50 ? "var(--color-success)" : pct > 20 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)", minWidth: 60 }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
        {remaining}/{total}
      </span>
    </div>
  );
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "depleted", label: "Depleted" },
  { key: "expired", label: "Expired" },
  { key: "quarantined", label: "Quarantined" },
];

export default function InventoryPage() {
  const { villageId } = useVillageScope();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("item_lots")
      .select("*, item_master(name, unit, category, is_peroxide), villages(name), labs(name)")
      .order("created_at", { ascending: false });
    if (villageId) q = q.eq("village_id", villageId);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setLots(data ?? []);
    setLoading(false);
  }, [villageId]);

  useEffect(() => { load(); }, [load]);

  const tabs = STATUS_TABS.map(t => ({
    ...t,
    count: t.key === "all" ? lots.length : lots.filter(l => l.status === t.key).length,
  }));

  const filtered = lots
    .filter(l => activeTab === "all" || l.status === activeTab)
    .filter(l => !search || (l.item_master as any)?.name?.toLowerCase().includes(search.toLowerCase()) || l.lot_number?.toLowerCase().includes(search.toLowerCase()));

  const isLowStock = (l: any) => l.status === "active" && l.remaining_quantity / l.received_quantity < 0.2;
  const isExpiringSoon = (l: any) => {
    if (!l.expiry_date) return false;
    const exp = new Date(l.expiry_date);
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    return isAfter(soon, exp) && isAfter(exp, new Date());
  };

  const columns: Column<any>[] = [
    {
      key: "item", header: "Item",
      render: r => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
            {(r.item_master as any)?.name}
            {isLowStock(r) && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>Low</span>}
            {isExpiringSoon(r) && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>Expiring</span>}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Lot: {r.lot_number}</p>
        </div>
      ),
    },
    { key: "village", header: "Village", render: r => <span className="text-sm">{(r.villages as any)?.name ?? "—"}</span> },
    {
      key: "stock", header: "Stock",
      render: r => <StockBar remaining={r.remaining_quantity} total={r.received_quantity} />,
    },
    {
      key: "expiry_date", header: "Expiry", sortable: true,
      render: r => r.expiry_date ? (
        <span className="text-xs" style={{ color: isExpiringSoon(r) ? "var(--color-warning)" : "var(--color-text-muted)" }}>
          {format(new Date(r.expiry_date), "dd MMM yyyy")}
        </span>
      ) : <span style={{ color: "var(--color-text-muted)" }}>—</span>,
    },
    {
      key: "status", header: "Status",
      render: r => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: "received_date", header: "Received", sortable: true,
      render: r => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{format(new Date(r.received_date), "dd MMM yyyy")}</span>,
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
            <Boxes size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Inventory</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{lots.length} lots</p>
          </div>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by item or lot…" className="w-72" />
      </div>
      {error && <ErrorBanner message={error} />}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <Card padding={false}>
        <DataTable
          columns={columns}
          data={filtered}
          keyFn={r => r.id}
          emptyState={<EmptyState title="No lots found" description="No inventory matches this filter." />}
        />
      </Card>
    </div>
  );
}
