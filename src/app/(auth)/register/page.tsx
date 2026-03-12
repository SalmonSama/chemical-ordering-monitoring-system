import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div
      className="rounded-2xl shadow-xl p-8 animate-fade-in"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="text-center mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Create your account
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Your account will be reviewed by an administrator
        </p>
      </div>

      <RegisterForm />

      <p
        className="text-center text-sm mt-6"
        style={{ color: "var(--color-text-muted)" }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium transition-base"
          style={{ color: "var(--color-brand-600)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
