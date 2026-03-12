import { clsx } from "clsx";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  BadgeVariant,
  { background: string; color: string }
> = {
  default: {
    background: "var(--color-surface-alt)",
    color: "var(--color-text-secondary)",
  },
  success: {
    background: "var(--color-success-bg)",
    color: "var(--color-success)",
  },
  warning: {
    background: "var(--color-warning-bg)",
    color: "var(--color-warning)",
  },
  danger: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger)",
  },
  info: {
    background: "var(--color-info-bg)",
    color: "var(--color-info)",
  },
  purple: {
    background: "var(--color-brand-100)",
    color: "var(--color-brand-700)",
  },
  muted: {
    background: "var(--color-border)",
    color: "var(--color-text-muted)",
  },
};

/** Map domain status strings to badge variants */
export function statusVariant(
  status: string
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    // User status
    active: "success",
    pending: "warning",
    rejected: "danger",
    inactive: "muted",
    // Order status
    approved: "success",
    ordered: "info",
    partially_received: "warning",
    received: "success",
    closed: "muted",
    // Lot status
    depleted: "muted",
    expired: "danger",
    quarantined: "danger",
    disposed: "muted",
    // Inspection status
    normal: "success",
    warning: "warning",
    quarantine: "danger",
    // Extension / regulatory
    pending_review: "warning",
  };
  return map[status] ?? "default";
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const vs = variantStyles[variant];
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
      style={{ background: vs.background, color: vs.color }}
    >
      {children}
    </span>
  );
}
