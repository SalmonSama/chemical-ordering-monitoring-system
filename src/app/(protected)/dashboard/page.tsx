"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import {
  ShoppingCart, CheckSquare, Boxes, FlaskConical,
  TrendingUp, TrendingDown, Minus, ArrowRight, AlertTriangle
} from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { format } from "date-fns";
import Link from "next/link";
import { useVillageScope } from "@/hooks/useVillageScope";

interface KpiData {
  totalOrders: number;
  pendingApprovals: number;
  activeLots: number;
  peroxideWarnings: number;
}

interface LowStockLot {
  id: string;
  lot_number: string;
  remaining_quantity: number;
  received_quantity: number;
  unit: string;
  item_master: { name: string; min_stock_level: number | null } | null;
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

export default function DashboardPage() {
  const { villageId } = useVillageScope();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [lowStockLots, setLowStockLots] = useState<LowStockLot[]>([]);
  const [peroxideAlerts, setPeroxideAlerts] = useState<PeroxideAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Build scoped queries
      let poQuery = supabase.from("purchase_orders").select("id, status, item_master(name), villages(name), created_at", { count: "exact" });
      let pendingQuery = supabase.from("purchase_orders").select("id, status, item_master(name), villages(name), requester_id, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5);
      let lotQuery = supabase.from("item_lots").select("id, status", { count: "exact" }).eq("status", "active");
      let peroxideQuery = supabase.from("peroxide_inspections").select("id, status", { count: "exact" }).in("status", ["warning", "quarantine"]);
      let txQuery = supabase.from("transactions").select("id, type, description, created_at").order("created_at", { ascending: false }).limit(8);

      if (villageId) {
        poQuery = poQuery.eq("village_id", villageId);
        pendingQuery = pendingQuery.eq("village_id", villageId);
        lotQuery = lotQuery.eq("village_id", villageId);
        txQuery = txQuery.eq("village_id", villageId);
      }

      // Low stock: lots where remaining < min_stock_level
      let lowStockQ = supabase
        .from("item_lots")
        .select("id, lot_number, remaining_quantity, received_quantity, unit, item_master(name, min_stock_level)")
        .eq("status", "active")
        .order("remaining_quantity");
      if (villageId) lowStockQ = lowStockQ.eq("village_id", villageId);

      // Peroxide alerts: peroxide lots in warning/quarantine status
      let peroxideAlertsQ = supabase
        .from("item_lots")
        .select("id, lot_number, remaining_quantity, unit, status, item_master(name), villages(name)")
        .eq("is_peroxide", true)
        .in("status", ["active", "quarantined"]);
      if (villageId) peroxideAlertsQ = peroxideAlertsQ.eq("village_id", villageId);

      const [ordersRes, pendingRes, lotsRes, peroxideRes, txRes, lowStockRes, peroxideAlertsRes] = await Promise.all([
        poQuery,
        pendingQuery,
        lotQuery,
        peroxideQuery,
        txQuery,
        lowStockQ,
        peroxideAlertsQ,
      ]);

      setKpi({
        totalOrders: ordersRes.count ?? 0,
        pendingApprovals: (ordersRes.data ?? []).filter((o: any) => o.status === "pending").length,
        activeLots: lotsRes.count ?? 0,
        peroxideWarnings: peroxideRes.count ?? 0,
      });
      setPendingOrders(pendingRes.data ?? []);
      setRecentTx(txRes.data ?? []);

      // Filter low stock by min_stock_level
      const ls = (lowStockRes.data ?? []) as LowStockLot[];
      setLowStockLots(ls.filter((l) => l.item_master?.min_stock_level != null && l.remaining_quantity < l.item_master.min_stock_level!).slice(0, 5));
      setPeroxideAlerts((peroxideAlertsRes.data ?? []) as PeroxideAlert[]);
      setLoading(false);
    }
    load();
  }, [villageId]);

  if (loading) return <PageLoader />;

  const kpiCards = [
    { label: "Total Orders", value: kpi!.totalOrders, icon: <ShoppingCart size={20} />, color: "var(--color-brand-600)", bg: "var(--color-brand-100)" },
    { label: "Pending Approvals", value: kpi!.pendingApprovals, icon: <CheckSquare size={20} />, color: "var(--color-warning)", bg: "var(--color-warning-bg)", link: "/approvals" },
    { label: "Active Lots", value: kpi!.activeLots, icon: <Boxes size={20} />, color: "var(--color-success)", bg: "var(--color-success-bg)"},
    { label: "Peroxide Alerts", value: kpi!.peroxideWarnings, icon: <FlaskConical size={20} />, color: "var(--color-danger)", bg: "var(--color-danger-bg)", link: "/peroxide" },
  ];

  const TX_TYPE_LABELS: Record<string, string> = {
    order_created: "Order Created", order_approved: "Order Approved", order_rejected: "Order Rejected",
    check_in: "Check-in", check_out: "Check-out", inspection: "Inspection",
    shelf_life_extension: "Shelf Life Ext.", regulatory_update: "Regulatory Update", user_approved: "User Approved",
  };

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

      {/* Phase 2 Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Widget */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Low Stock Alerts</h2>
            <Link href="/inventory" className="text-xs font-medium transition-base" style={{ color: "var(--color-brand-600)" }}>View inventory</Link>
          </div>
          {lowStockLots.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>All stock levels are adequate</p>
          ) : (
            <div className="space-y-2">
              {lowStockLots.map((lot) => {
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
              {peroxideAlerts.slice(0, 5).map((lot) => (
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
