"use client";

import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, ...rest }: TextareaProps) {
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
      <textarea
        id={inputId}
        rows={3}
        className="w-full px-3 py-2.5 rounded-lg text-sm transition-base resize-none"
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
    </div>
  );
}
