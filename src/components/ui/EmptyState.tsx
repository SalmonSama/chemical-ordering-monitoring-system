import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: "var(--color-surface-alt)" }}
      >
        {icon ?? (
          <PackageSearch size={24} style={{ color: "var(--color-text-muted)" }} />
        )}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </p>
        {description && (
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
