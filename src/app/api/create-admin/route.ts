import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@chemtrack.com",
      password: "admin1234",
      email_confirm: true,
      user_metadata: { full_name: "System Admin" }
    });

    if (authError && !authError.message.includes("already registered")) {
      return NextResponse.json({ error: authError }, { status: 400 });
    }

    let userId = authData?.user?.id;

    // If exists, fetch ID
    if (!userId) {
      const { data: user } = await supabase.from("user_profiles").select("id").eq("email", "admin@chemtrack.com").single();
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Could not resolve user ID" }, { status: 400 });
    }

    // 2. Set profile to active admin
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ role: "admin", status: "active", full_name: "System Admin" })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Admin created successfully! Login with admin@chemtrack.com / admin1234" });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
