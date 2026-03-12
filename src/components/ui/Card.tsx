import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className, padding = true, style }: CardProps) {
  return (
    <div
      className={clsx("rounded-xl shadow-sm", padding && "p-5", className)}
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div
      className="flex items-center justify-between pb-4 mb-4"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
