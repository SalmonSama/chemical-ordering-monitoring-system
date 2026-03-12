import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/** POST /api/admin/approve-user */
export async function POST(request: NextRequest) {
  // Verify the caller is an admin
  const cookieStore = await cookies();
  const supabaseUser = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseUser
    .from("user_profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, role } = body as {
    userId: string;
    action: "approve" | "reject";
    role?: string;
  };

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  // Use admin client (service role) to bypass RLS
  const adminClient = createAdminClient();
  const updates: Record<string, unknown> = {
    status: action === "approve" ? "active" : "rejected",
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  };
  if (action === "approve" && role) {
    updates.role = role;
  }

  const { error } = await adminClient
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create transaction record
  if (action === "approve") {
    await adminClient.from("transactions").insert({
      type: "user_approved",
      reference_id: userId,
      reference_type: "user_profiles",
      description: `User account approved with role ${role ?? "unassigned"}`,
      user_id: user.id,
    });
  }

  return NextResponse.json({ success: true });
}
