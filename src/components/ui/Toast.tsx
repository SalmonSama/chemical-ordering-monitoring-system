"use client";

import { useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { clsx } from "clsx";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
};

const toastStyles: Record<
  ToastType,
  { background: string; color: string; border: string }
> = {
  success: {
    background: "var(--color-success-bg)",
    color: "var(--color-success)",
    border: "1px solid var(--color-success)",
  },
  error: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger)",
    border: "1px solid var(--color-danger)",
  },
  info: {
    background: "var(--color-info-bg)",
    color: "var(--color-info)",
    border: "1px solid var(--color-info)",
  },
};

/** Render all toasts — place this once in the layout */
export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const s = toastStyles[t.type];
        return (
          <div
            key={t.id}
            className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm animate-fade-in")}
            style={{ background: s.background, color: s.color, border: s.border, minWidth: 240 }}
          >
            {icons[t.type]}
            <span className="flex-1 font-medium">{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="p-0.5 rounded opacity-70 hover:opacity-100 transition-base">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Hook to manage toast queue */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, remove };
}
