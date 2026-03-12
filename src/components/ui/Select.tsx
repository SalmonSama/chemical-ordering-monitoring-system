"use client";

import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({
  label,
  options,
  placeholder = "Select…",
  error,
  id,
  ...rest
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="w-full px-3 py-2.5 rounded-lg text-sm transition-base"
        style={{
          background: "var(--color-surface-alt)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          color: "var(--color-text-primary)",
          outline: "none",
        }}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
