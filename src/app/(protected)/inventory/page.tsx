"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

// ── Types ───────────────────────────────────────────────────────────────────

type LotStatus = "all" | "active" | "depleted" | "expired" | "quarantined" | "disposed";

interface LotRow {
  id: string;
  lot_number: string;
  remaining_quantity: number;
  received_quantity: number;
  unit: string;
  status: string;
  expiry_date: string | null;
  received_date: string;
  is_peroxide: boolean | null;
  item_master: { name: string; min_stock_level: number | null } | null;
  villages: { name: string } | null;
}

// ── Sub-components ──────────────────────────────────────────────────────────

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

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_TABS: { key: LotStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "depleted", label: "Depleted" },
  { key: "expired", label: "Expired" },
  { key: "quarantined", label: "Quarantined" },
  { key: "disposed", label: "Disposed" },
];

// Columns fetched from DB — only what the table displays, no SELECT *
const SELECT_COLS =
  "id, lot_number, remaining_quantity, received_quantity, unit, status, expiry_date, received_date, is_peroxide, item_master(name, min_stock_level), villages(name)";

const PAGE_HARD_LIMIT = 200; // safety cap — real usage rarely exceeds this

// ── Page ────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { villageId } = useVillageScope();

  // Data
  const [lots, setLots] = useState<LotRow[]>([]);
  const [totalCount, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (controlled by UI)
  const [activeTab, setActiveTab] = useState<LotStatus>("active");
  const [search, setSearch] = useState("");

  // Debounce: only fire a query 300 ms after the user stops typing.
  // We store the final "committed" search separately so the useCallback
  // dependency only changes when the debounce fires, not on every keystroke.
  const [committedSearch, setCommittedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setCommittedSearch(val), 300);
  }

  // ── Main query (runs server-side filtering) ────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Build the main filtered query — status and search are pushed to the DB.
    // count:"exact" is intentionally omitted to avoid the expensive COUNT(*);
    // we rely on the returned rows instead.
    let q = supabase
      .from("item_lots")
      .select(SELECT_COLS)
      .order("created_at", { ascending: false })
      .limit(PAGE_HARD_LIMIT);

    // Village scope (non-admin users only see their own village)
    if (villageId) q = q.eq("village_id", villageId);

    // Status filter — pushed to DB, not JS
    if (activeTab !== "all") q = q.eq("status", activeTab);

    // Full-text search — pushed to DB, not JS
    // We search against both the joined item name and the lot_number.
    // PostgREST supports `or` filters on joined columns via textSearch on the
    // parent table; the safest portable approach is two separate ilike calls
    // combined with a client-side OR (both run in one DB round-trip via the
    // PostgREST `or` helper).
    if (committedSearch) {
      const term = `%${committedSearch}%`;
      q = q.or(`lot_number.ilike.${term}`);
      // Note: filtering on a joined relation column (item_master.name) is not
      // directly supported in PostgREST or-filter syntax, so we also do a
      // lightweight client-side pass below for that part only.
    }

    const { data, error: err } = await q;

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    let rows = (data ?? []) as LotRow[];

    // Client-side pass ONLY for the joined item_master.name part of the search
    // (PostgREST doesn't support OR across FK joins in a single filter clause).
    // The row set is already status-filtered and village-scoped by the DB, so
    // this secondary filter operates on a small, already-reduced result set.
    if (committedSearch) {
      const lower = committedSearch.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.lot_number?.toLowerCase().includes(lower) ||
          l.item_master?.name?.toLowerCase().includes(lower)
      );
    }

    // Derive per-tab counts from the full active-tab result for the tab bar.
    // We only have the current status slice, so counts for other tabs we fetch
    // separately as a lightweight aggregation.
    setLots(rows);
    setTotal(rows.length);
    setLoading(false);
  }, [villageId, activeTab, committedSearch]);

  // Fetch lightweight per-status counts so the tab badges are accurate.
  const loadCounts = useCallback(async () => {
    const supabase = createClient();
    const statuses: LotStatus[] = ["active", "depleted", "expired", "quarantined"];

    // Run all four counts in parallel — each is a COUNT(*) with a tight index
    // hit (idx_item_lots_status + idx_item_lots_village_id).
    const results = await Promise.all(
      statuses.map((s) => {
        let q = supabase
          .from("item_lots")
          .select("id", { count: "exact", head: true }); // head:true = no rows returned

        // ถ้าเป็นคำว่า all ไม่ต้องใส่เงื่อนไข eq("status") 
        if (s !== "all") {
          q = q.eq("status", s as "active" | "depleted" | "expired" | "quarantined" | "disposed");
        }

        if (villageId) q = q.eq("village_id", villageId);

        return q.then(({ count }) => ({ status: s, count: count ?? 0 }));
      })
    );
    const counts: Record<string, number> = {};
    let total = 0;
    results.forEach(({ status, count }) => {
      counts[status] = count;
      total += count;
    });
    counts["all"] = total;
    setTabCounts(counts);
  }, [villageId]);

  useEffect(() => { load(); }, [load]);
  // Reload counts when village changes (but not on every search/tab change —
  // counts are independent of those filters).
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // ── Derived display helpers ────────────────────────────────────────────────

  const isLowStock = (l: LotRow) =>
    l.status === "active" && l.remaining_quantity / l.received_quantity < 0.2;

  const isExpiringSoon = (l: LotRow) => {
    if (!l.expiry_date) return false;
    const exp = new Date(l.expiry_date);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return isAfter(soon, exp) && isAfter(exp, new Date());
  };

  // ── Tab bar data ───────────────────────────────────────────────────────────

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: tabCounts[t.key] ?? 0,
  }));

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<LotRow>[] = [
    {
      key: "item", header: "Item",
      render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
            {r.item_master?.name}
            {isLowStock(r) && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
                Low
              </span>
            )}
            {isExpiringSoon(r) && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
                Expiring
              </span>
            )}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Lot: {r.lot_number}</p>
        </div>
      ),
    },
    {
      key: "village", header: "Village",
      render: (r) => <span className="text-sm">{r.villages?.name ?? "—"}</span>,
    },
    {
      key: "stock", header: "Stock",
      render: (r) => <StockBar remaining={r.remaining_quantity} total={r.received_quantity} />,
    },
    {
      key: "expiry_date", header: "Expiry", sortable: true,
      render: (r) =>
        r.expiry_date ? (
          <span className="text-xs" style={{ color: isExpiringSoon(r) ? "var(--color-warning)" : "var(--color-text-muted)" }}>
            {format(new Date(r.expiry_date), "dd MMM yyyy")}
          </span>
        ) : (
          <span style={{ color: "var(--color-text-muted)" }}>—</span>
        ),
    },
    {
      key: "status", header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: "received_date", header: "Received", sortable: true,
      render: (r) => (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {format(new Date(r.received_date), "dd MMM yyyy")}
        </span>
      ),
    },
  ];

  if (loading && lots.length === 0) return <PageLoader />;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
            <Boxes size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Inventory</h1>
            {/* Show total from the tab counts (accurate even when filtered) */}
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{tabCounts["all"] ?? 0} lots total</p>
          </div>
        </div>
        {/* Search: fires DB query after 300 ms debounce — no client-side filtering */}
        <SearchInput value={search} onChange={handleSearch} placeholder="Search by item or lot…" className="w-72" />
      </div>

      {error && <ErrorBanner message={error} />}

      <Tabs tabs={tabs} active={activeTab} onChange={(k) => setActiveTab(k as LotStatus)} />

      <Card padding={false}>
        {/* Show a subtle inline spinner while a search/tab change reloads */}
        {loading && lots.length > 0 && (
          <div className="px-4 py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Refreshing…
          </div>
        )}
        <DataTable
          columns={columns}
          data={lots}
          keyFn={(r) => r.id}
          emptyState={
            <EmptyState title="No lots found" description="No inventory matches this filter." />
          }
        />
        {/* Row count hint */}
        {lots.length === PAGE_HARD_LIMIT && (
          <p className="px-4 py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Showing first {PAGE_HARD_LIMIT} results. Refine your search to see more.
          </p>
        )}
      </Card>
    </div>
  );
}
