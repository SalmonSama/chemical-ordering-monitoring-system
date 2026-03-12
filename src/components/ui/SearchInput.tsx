"use client";

import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: SearchInputProps) {
  return (
    <div
      className={`relative flex items-center ${className}`}
    >
      <Search
        size={16}
        className="absolute left-3 pointer-events-none"
        style={{ color: "var(--color-text-muted)" }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg transition-base"
        style={{
          background: "var(--color-surface-alt)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
          outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-500)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 p-0.5 rounded transition-base"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
