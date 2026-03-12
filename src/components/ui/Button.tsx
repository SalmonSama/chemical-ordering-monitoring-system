"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, { background: string; color: string; border?: string }> = {
  primary: {
    background: "var(--color-brand-600)",
    color: "var(--color-text-inverse)",
  },
  secondary: {
    background: "var(--color-surface-alt)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
  },
  danger: {
    background: "var(--color-danger)",
    color: "#fff",
  },
  success: {
    background: "var(--color-success)",
    color: "#fff",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-sm rounded-lg gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  style,
  ...rest
}: ButtonProps) {
  const vs = variantStyles[variant];
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-base cursor-pointer",
        sizeClasses[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        background: vs.background,
        color: vs.color,
        border: vs.border,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          className="animate-spin rounded-full border-2"
          style={{
            width: 14,
            height: 14,
            borderColor: "transparent",
            borderTopColor: "currentColor",
          }}
        />
      )}
      {children}
    </button>
  );
}
