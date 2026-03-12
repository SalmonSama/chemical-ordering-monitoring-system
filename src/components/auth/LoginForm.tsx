"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/services/auth.service";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium animate-fade-in"
          style={{
            background: "var(--color-danger-bg)",
            color: "var(--color-danger)",
            border: "1px solid var(--color-danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm transition-base"
          style={{
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-brand-500)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-border)")
          }
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm transition-base"
          style={{
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-brand-500)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-border)")
          }
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-base"
        style={{
          background: loading
            ? "var(--color-brand-400)"
            : "var(--color-brand-600)",
          color: "var(--color-text-inverse)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
