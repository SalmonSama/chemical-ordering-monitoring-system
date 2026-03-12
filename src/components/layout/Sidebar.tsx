"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  ShoppingCart,
  CheckSquare,
  PackagePlus,
  Minus,
  Boxes,
  FlaskConical,
  CalendarClock,
  FileText,
  ReceiptText,
  Users,
  Package,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresPath: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard",          href: "/dashboard",     icon: <LayoutDashboard size={18} />, requiresPath: "/dashboard" },
      { label: "Order Request",       href: "/orders/new",    icon: <ShoppingCart size={18} />,    requiresPath: "/orders/new" },
      { label: "Orders",             href: "/orders",        icon: <ReceiptText size={18} />,     requiresPath: "/orders" },
      { label: "Approvals",          href: "/approvals",     icon: <CheckSquare size={18} />,     requiresPath: "/approvals" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Check-in",           href: "/check-in",      icon: <PackagePlus size={18} />,     requiresPath: "/check-in" },
      { label: "Check-out",          href: "/check-out",     icon: <Minus size={18} />,           requiresPath: "/check-out" },
      { label: "Inventory",          href: "/inventory",     icon: <Boxes size={18} />,           requiresPath: "/inventory" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Peroxide Monitor",   href: "/peroxide",      icon: <FlaskConical size={18} />,    requiresPath: "/peroxide" },
      { label: "Shelf Life",         href: "/shelf-life",    icon: <CalendarClock size={18} />,   requiresPath: "/shelf-life" },
      { label: "Regulatory",         href: "/regulatory",    icon: <FileText size={18} />,        requiresPath: "/regulatory" },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Transactions",       href: "/transactions",  icon: <ReceiptText size={18} />,     requiresPath: "/transactions" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users",              href: "/admin/users",     icon: <Users size={18} />,           requiresPath: "/admin/users" },
      { label: "Items",              href: "/admin/items",     icon: <Package size={18} />,         requiresPath: "/admin/items" },
      { label: "Villages & Labs",    href: "/admin/villages",  icon: <Building2 size={18} />,       requiresPath: "/admin/villages" },
      { label: "System Settings",    href: "/admin/settings",  icon: <Settings size={18} />,        requiresPath: "/admin/settings" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "My Settings",        href: "/settings",        icon: <Settings size={18} />,        requiresPath: "/settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { canAccess } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: "var(--color-sidebar-bg)" }}
    >
      {/* Logo + Collapse Toggle */}
      <div
        className="flex items-center justify-between px-4 h-16 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--color-brand-500)" }}
            >
              <FlaskConical size={15} color="white" />
            </div>
            <span
              className="font-bold text-sm tracking-tight truncate"
              style={{ color: "var(--color-text-inverse)" }}
            >
              ChemTrack
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-brand-500)" }}>
            <FlaskConical size={15} color="white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={clsx(
            "p-1 rounded-md transition-base",
            collapsed && "mx-auto"
          )}
          style={{ color: "var(--color-sidebar-muted)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            canAccess(item.requiresPath)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p
                  className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-sidebar-muted)" }}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/orders"
                      ? pathname === "/orders"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-base",
                        collapsed && "justify-center"
                      )}
                      style={{
                        background: isActive
                          ? "var(--color-sidebar-active)"
                          : "transparent",
                        color: isActive
                          ? "var(--color-text-inverse)"
                          : "var(--color-sidebar-text)",
                      }}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
