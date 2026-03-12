"use client";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-base"
          style={{
            background: tab.key === active ? "var(--color-surface-card)" : "transparent",
            color:
              tab.key === active
                ? "var(--color-text-primary)"
                : "var(--color-text-muted)",
            boxShadow:
              tab.key === active ? "var(--shadow-sm)" : "none",
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background:
                  tab.key === active
                    ? "var(--color-brand-100)"
                    : "var(--color-border)",
                color:
                  tab.key === active
                    ? "var(--color-brand-600)"
                    : "var(--color-text-muted)",
                fontWeight: 600,
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
