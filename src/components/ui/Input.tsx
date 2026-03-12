"use client";

import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "w-full px-3 py-2.5 rounded-lg text-sm transition-base",
          className
        )}
        style={{
          background: "var(--color-surface-alt)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          color: "var(--color-text-primary)",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? "var(--color-danger)"
            : "var(--color-brand-500)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "var(--color-danger)"
            : "var(--color-border)";
        }}
        {...rest}
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
