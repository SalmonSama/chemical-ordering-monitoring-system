"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVillageScope } from "@/hooks/useVillageScope";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { ReceiptText } from "lucide-react";

const TX_TYPES = [
  "order_created", "order_approved", "order_rejected",
  "check_in", "check_out", "inspection",
  "shelf_life_extension", "regulatory_update", "user_approved",
];

const TX_LABELS: Record<string, string> = {
  order_created: "Order Created", order_approved: "Order Approved", order_rejected: "Order Rejected",
  check_in: "Check-in", check_out: "Check-out", inspection: "Inspection",
  shelf_life_extension: "Shelf Life Ext.", regulatory_update: "Regulatory Update", user_approved: "User Approved",
};

const TX_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "purple" | "muted" | "default"> = {
  order_created: "info", order_approved: "success", order_rejected: "danger",
  check_in: "success", check_out: "warning", inspection: "purple",
  shelf_life_extension: "info", regulatory_update: "purple", user_approved: "success",
};

const PAGE_SIZE = 12;

export default function TransactionsPage() {
  const { villageId } = useVillageScope();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const offset = (page - 1) * PAGE_SIZE;

    let q = supabase
      .from("transactions")
      .select("*, user:user_profiles!transactions_user_id_fkey(full_name), villages(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (villageId) q = q.eq("village_id", villageId);
    if (typeFilter) q = q.eq("type", typeFilter as any);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    if (search) q = q.ilike("description", `%${search}%`);

    const { data, error: err, count } = await q;
    if (err) setError(err.message);
    else { setTransactions(data ?? []); setTotalCount(count ?? 0); }
    setLoading(false);
  }, [villageId, page, search, typeFilter, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [search, typeFilter, dateFrom, dateTo]);
  useEffect(() => { load(); }, [load]);

  const columns: Column<any>[] = [
    {
      key: "type", header: "Type",
      render: r => <Badge variant={TX_VARIANTS[r.type] ?? "default"}>{TX_LABELS[r.type] ?? r.type}</Badge>,
    },
    {
      key: "description", header: "Description",
      render: r => <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{r.description}</span>,
    },
    { key: "user", header: "User", render: r => <span className="text-sm">{(r.user as any)?.full_name ?? "—"}</span> },
    { key: "villages", header: "Village", render: r => <span className="text-sm text-muted">{(r.villages as any)?.name ?? "—"}</span> },
    {
      key: "created_at", header: "Date", sortable: true,
      render: r => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}</span>,
    },
  ];

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <ReceiptText size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Transaction History</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Full audit log · {totalCount} records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search description…" className="w-64" />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        >
          <option value="">All types</option>
          {TX_TYPES.map(t => <option key={t} value={t}>{TX_LABELS[t]}</option>)}
        </select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" placeholder="From" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" placeholder="To" />
      </div>

      {error && <ErrorBanner message={error} />}

      <Card padding={false}>
        {loading ? (
          <div className="py-12 flex justify-center"><span className="animate-spin rounded-full border-2" style={{ width: 28, height: 28, borderColor: "var(--color-border)", borderTopColor: "var(--color-brand-500)" }} /></div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={transactions}
              keyFn={r => r.id}
              emptyState={<EmptyState title="No transactions found" description="Try adjusting your filters." />}
            />
            <div className="px-4 py-2" style={{ borderTop: "1px solid var(--color-border)" }}>
              <Pagination
                page={page}
                totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                onPage={setPage}
                totalItems={totalCount}
                itemsPerPage={PAGE_SIZE}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
