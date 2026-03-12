"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { User, Lock, Save } from "lucide-react";

export default function SettingsPage() {
  const { profile, loading } = useUser();
  const { toasts, toast, remove } = useToast();

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Sync profile form when profile loads
  if (profile && profileForm.full_name === "" && profile.full_name) {
    setProfileForm({ full_name: profile.full_name });
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !profileForm.full_name.trim()) return;
    setProfileError(null);
    setProfileSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("user_profiles")
      .update({ full_name: profileForm.full_name.trim() })
      .eq("id", profile.id);
    if (err) setProfileError(err.message);
    else toast("success", "Profile updated");
    setProfileSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (err) setPwError(err.message);
    else {
      toast("success", "Password changed successfully");
      setPwForm({ current: "", newPw: "", confirm: "" });
    }
    setPwSaving(false);
  }

  if (loading) return <PageLoader />;
  if (!profile) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)" }}>
          <User size={20} style={{ color: "var(--color-brand-600)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Settings</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Manage your profile and account security</p>
        </div>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader title="Profile" subtitle="Update your display name" />
        {profileError && <div className="mt-3"><ErrorBanner message={profileError} /></div>}
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <Input
            label="Full Name *"
            required
            value={profileForm.full_name}
            onChange={(e) => setProfileForm({ full_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={profile.email} disabled hint="Contact admin to change email" />
            <Input label="Role" value={profile.role ?? "—"} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Village" value={(profile as any).villages?.name ?? "—"} disabled />
            <Input label="Lab" value={(profile as any).labs?.name ?? "—"} disabled />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={profileSaving}>
              <Save size={15} /> Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader title="Change Password" subtitle="Use a strong password of at least 8 characters" />
        {pwError && <div className="mt-3"><ErrorBanner message={pwError} /></div>}
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <Input
            label="New Password *"
            type="password"
            required
            value={pwForm.newPw}
            onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm New Password *"
            type="password"
            required
            value={pwForm.confirm}
            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={pwSaving} disabled={!pwForm.newPw || !pwForm.confirm}>
              <Lock size={15} /> Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
