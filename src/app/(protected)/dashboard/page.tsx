"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import {
  ShoppingCart, CheckSquare, Boxes, FlaskConical,
  ArrowRight, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import Link from "next/link";
import { useVillageScope } from "@/hooks/useVillageScope";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_orders: number;
  pending_approvals: number;
  active_lots: number;
  peroxide_warnings: number;
  low_stock_lots: LowStockLot[];
}

interface LowStockLot {
  id: string;
  lot_number: string;
  remaining_quantity: number;
  received_quantity: number;
  unit: string;
  item_master: { name: string; min_stock_level: number } | null;
}

interface TrendPoint {
  month: string;
  orders: number;
  checkIns: number;
}

interface PeroxideAlert {
  id: string;
  lot_number: string;
  remaining_quantity: number;
  unit: string;
  status: string;
  item_master: { name: string } | null;
  villages: { name: string } | null;
}

// ── Page ───────────────────────────────────────────────────────────────────

const TX_TYPE_LABELS: Record<string, string> = {
  order_created: "Order Created", order_approved: "Order Approved",
  order_rejected: "Order Rejected", check_in: "Check-in",
  check_out: "Check-out", inspection: "Inspection",
  shelf_life_extension: "Shelf Life Ext.", regulatory_update: "Regulatory Update",
  user_approved: "User Approved",
};

export default function DashboardPage() {
  const { villageId } = useVillageScope();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [peroxideAlerts, setPeroxideAlerts] = useState<PeroxideAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // ── Performance optimisation ────────────────────────────────────────
      // BEFORE: 8 separate parallel queries, 2× count:"exact", JS bucket loop
      // AFTER:  4 targeted queries
      //   1. get_dashboard_stats RPC  — all KPI counts + low-stock in one call
      //   2. get_activity_trend  RPC  — 6-month trend aggregated in DB (not JS)
      //   3. pending orders list      — already scoped + limited
      //   4. recent transactions      — already limited to 8 rows

      const [statsRes, trendRes, pendingRes, txRes, peroxideAlertsRes] =
        await Promise.all([
          // 1. All KPI counts + low-stock lots — single DB round-trip
          supabase.rpc("get_dashboard_stats", {
            p_village_id: villageId ?? null,
          }),

          // 2. Trend data aggregated by DB (date_trunc GROUP BY) instead of
          //    loading all transactions and bucketing in JS
          supabase.rpc("get_activity_trend", {
            p_village_id: villageId ?? null,
            p_months: 6,
          }),

          // 3. Pending order details for the widget (select only needed cols)
          (() => {
            let q = supabase
              .from("purchase_orders")
              .select("id, status, item_master(name), villages(name), created_at")
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(5);
            if (villageId) q = q.eq("village_id", villageId);
            return q;
          })(),

          // 4. Recent transactions (select only necessary cols)
          (() => {
            let q = supabase
              .from("transactions")
              .select("id, type, description, created_at")
              .order("created_at", { ascending: false })
              .limit(8);
            if (villageId) q = q.eq("village_id", villageId);
            return q;
          })(),

          // 5. Peroxide-flagged lots for the monitor widget
          (() => {
            let q = supabase
              .from("item_lots")
              .select("id, lot_number, remaining_quantity, unit, status, item_master(name), villages(name)")
              .eq("is_peroxide", true)
              .in("status", ["active", "quarantined"])
              .limit(5);
            if (villageId) q = q.eq("village_id", villageId);
            return q;
          })(),
        ]);

      // Unwrap Dashboard Stats RPC result
      const rawStats = statsRes.data as DashboardStats | null;
      setStats(rawStats ?? {
        total_orders: 0, pending_approvals: 0,
        active_lots: 0, peroxide_warnings: 0, low_stock_lots: [],
      });

      // Trend data is already aggregated by the DB function
      setTrendData((trendRes.data as TrendPoint[] | null) ?? []);

      setPendingOrders(pendingRes.data ?? []);
      setRecentTx(txRes.data ?? []);
      setPeroxideAlerts((peroxideAlertsRes.data as PeroxideAlert[]) ?? []);
      setLoading(false);
    }

    load();
  }, [villageId]);

  if (loading) return <PageLoader />;

  const kpiCards = [
    { label: "Total Orders",      value: stats!.total_orders,      icon: <ShoppingCart size={20} />, color: "var(--color-brand-600)", bg: "var(--color-brand-100)" },
    { label: "Pending Approvals", value: stats!.pending_approvals, icon: <CheckSquare size={20} />,  color: "var(--color-warning)",   bg: "var(--color-warning-bg)", link: "/approvals" },
    { label: "Active Lots",       value: stats!.active_lots,       icon: <Boxes size={20} />,        color: "var(--color-success)",   bg: "var(--color-success-bg)" },
    { label: "Peroxide Alerts",   value: stats!.peroxide_warnings, icon: <FlaskConical size={20} />, color: "var(--color-danger)",    bg: "var(--color-danger-bg)",  link: "/peroxide" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Welcome back! Here&apos;s an overview of your lab system.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>{card.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
            </div>
            {card.link && (
              <Link href={card.link} className="flex items-center gap-1 text-xs mt-3 font-medium transition-base" style={{ color: card.color }}>
                View all <ArrowRight size={12} />
              </Link>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Widget */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Pending Approvals</h2>
            <Link href="/approvals" className="text-xs font-medium transition-base" style={{ color: "var(--color-brand-600)" }}>View all</Link>
          </div>
          {pendingOrders.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>No pending orders</p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--color-surface-alt)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {(order.item_master as any)?.name ?? "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {(order.villages as any)?.name ?? "—"} · {format(new Date(order.created_at), "dd MMM")}
                    </p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Recent Activity</h2>
            <Link href="/transactions" className="text-xs font-medium transition-base" style={{ color: "var(--color-brand-600)" }}>View all</Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: "var(--color-surface-alt)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--color-brand-500)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {TX_TYPE_LABELS[tx.type] ?? tx.type}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{tx.description}</p>
                  </div>
                  <p className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {format(new Date(tx.created_at), "dd MMM")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 6-Month Trend Chart — data now aggregated by DB, not JS */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Activity Trends</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Orders created vs. check-ins — last 6 months</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-brand-500)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-success)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "var(--color-text-muted)" }} />
            <Area type="monotone" dataKey="orders"   name="Orders"     stroke="var(--color-brand-500)" fill="url(#colorOrders)"   strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="checkIns" name="Check-ins"  stroke="var(--color-success)"   fill="url(#colorCheckIns)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Phase 2 Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Widget — items now filtered DB-side by the RPC */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Low Stock Alerts</h2>
            <Link href="/inventory" className="text-xs font-medium transition-base" style={{ color: "var(--color-brand-600)" }}>View inventory</Link>
          </div>
          {(stats!.low_stock_lots ?? []).length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>All stock levels are adequate</p>
          ) : (
            <div className="space-y-2">
              {stats!.low_stock_lots.map((lot) => {
                const min = lot.item_master?.min_stock_level ?? 1;
                const pct = Math.min((lot.remaining_quantity / min) * 100, 100);
                return (
                  <div key={lot.id} className="rounded-lg px-3 py-2.5" style={{ background: "var(--color-surface-alt)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {lot.item_master?.name}
                      </p>
                      <span className="text-xs" style={{ color: "var(--color-danger)" }}>
                        {lot.remaining_quantity} / {min} {lot.unit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--color-danger)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Peroxide Alerts Widget */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Peroxide Monitor</h2>
            <Link href="/peroxide" className="text-xs font-medium transition-base" style={{ color: "var(--color-brand-600)" }}>Record inspection</Link>
          </div>
          {peroxideAlerts.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>No peroxide lots to monitor</p>
          ) : (
            <div className="space-y-2">
              {peroxideAlerts.map((lot) => (
                <div key={lot.id} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--color-surface-alt)" }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {(lot.item_master as any)?.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Lot {lot.lot_number} · {(lot.villages as any)?.name}
                    </p>
                  </div>
                  {lot.status === "quarantined" ? (
                    <Badge variant="danger">Quarantined</Badge>
                  ) : (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-warning)" }}>
                      <AlertTriangle size={12} /> Needs inspection
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
