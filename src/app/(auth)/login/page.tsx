import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div
      className="rounded-2xl shadow-xl p-8 animate-fade-in"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
          style={{ background: "var(--color-brand-600)" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          ChemTrack
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Sign in to your account
        </p>
      </div>

      <LoginForm />

      <p
        className="text-center text-sm mt-6"
        style={{ color: "var(--color-text-muted)" }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium transition-base"
          style={{ color: "var(--color-brand-600)" }}
        >
          Register
        </Link>
      </p>
    </div>
  );
}
