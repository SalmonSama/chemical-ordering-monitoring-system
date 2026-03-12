import { AlertTriangle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
      style={{
        background: "var(--color-danger-bg)",
        border: "1px solid var(--color-danger)",
        color: "var(--color-danger)",
      }}
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
