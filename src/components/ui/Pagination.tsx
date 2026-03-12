"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  page,
  totalPages,
  onPage,
  totalItems,
  itemsPerPage = 12,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems ?? page * itemsPerPage);

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between py-4 px-1">
      {totalItems !== undefined && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Showing {start}–{end} of {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg transition-base disabled:opacity-40"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className="w-8 h-8 rounded-md text-sm font-medium transition-base"
              style={{
                background:
                  p === page
                    ? "var(--color-brand-600)"
                    : "transparent",
                color:
                  p === page
                    ? "#fff"
                    : "var(--color-text-secondary)",
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg transition-base disabled:opacity-40"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
