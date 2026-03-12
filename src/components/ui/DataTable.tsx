"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  keyFn: (row: T) => string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

type SortDir = "asc" | "desc";

export function DataTable<T extends object>({
  columns,
  data,
  keyFn,
  emptyState,
  loading,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <span
          className="animate-spin rounded-full border-2"
          style={{
            width: 28,
            height: 28,
            borderColor: "var(--color-border)",
            borderTopColor: "var(--color-brand-500)",
          }}
        />
      </div>
    );
  }

  if (!loading && sorted.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-2">
        {emptyState ?? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No records found.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide",
                  col.sortable && "cursor-pointer select-none hover:opacity-80",
                  col.headerClassName
                )}
                style={{ color: "var(--color-text-muted)" }}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc" ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={keyFn(row)}
              className="transition-base"
              style={{ borderBottom: "1px solid var(--color-border)" }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => e.key === "Enter" && onRowClick(row)
                  : undefined
              }
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx("py-3 px-4", col.className)}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
