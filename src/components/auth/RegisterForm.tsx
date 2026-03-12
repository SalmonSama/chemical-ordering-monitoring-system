"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type Village = Database["public"]["Tables"]["villages"]["Row"];
type Lab = Database["public"]["Tables"]["labs"]["Row"];

const ROLE_OPTIONS = [
  { value: "requester", label: "Requester" },
  { value: "staff", label: "Lab Staff" },
  { value: "focal_point", label: "Focal Point" },
  { value: "compliance", label: "Compliance Officer" },
];

export function RegisterForm() {
  const router = useRouter();
  const [villages, setVillages] = useState<Village[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    village_id: "",
    lab_id: "",
    requested_role: "requester",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("villages").select("*").order("name").then(({ data }) => {
      setVillages(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!form.village_id) {
      setLabs([]);
      setForm((f) => ({ ...f, lab_id: "" }));
      return;
    }
    const supabase = createClient();
    supabase
      .from("labs")
      .select("*")
      .eq("village_id", form.village_id)
      .order("name")
      .then(({ data }) => {
        setLabs(data ?? []);
        setForm((f) => ({ ...f, lab_id: "" }));
      });
  }, [form.village_id]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        village_id: form.village_id,
        lab_id: form.lab_id,
        requested_role: form.requested_role,
      });
      router.push("/pending-approval");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg text-sm transition-base";
  const inputStyle = {
    background: "var(--color-surface-alt)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
    outline: "none",
  };
  const labelCls = "text-sm font-medium";
  const labelStyle = { color: "var(--color-text-secondary)" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Full Name */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Full name</label>
        <input
          type="text"
          required
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-500)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Email address</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-500)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* Village */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Village</label>
        <select
          required
          value={form.village_id}
          onChange={(e) => set("village_id", e.target.value)}
          className={inputCls}
          style={inputStyle}
        >
          <option value="">Select village…</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Lab */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Lab</label>
        <select
          required
          value={form.lab_id}
          onChange={(e) => set("lab_id", e.target.value)}
          disabled={!form.village_id || labs.length === 0}
          className={inputCls}
          style={inputStyle}
        >
          <option value="">
            {form.village_id ? "Select lab…" : "Select a village first"}
          </option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Role preference */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Preferred role</label>
        <select
          value={form.requested_role}
          onChange={(e) => set("requested_role", e.target.value)}
          className={inputCls}
          style={inputStyle}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-500)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1">
        <label className={labelCls} style={labelStyle}>Confirm password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-500)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-base mt-2"
        style={{
          background: loading
            ? "var(--color-brand-400)"
            : "var(--color-brand-600)",
          color: "var(--color-text-inverse)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
