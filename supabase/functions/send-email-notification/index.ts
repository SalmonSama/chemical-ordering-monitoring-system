import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Webhook payload:", body);

    const record = body.record;

    if (!record || !record.user_id) {
      return new Response("Missing record data", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response("Missing Supabase config", { status: 500 });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("id", record.user_id)
      .single();

    if (error || !profile?.email) {
      console.error("Could not find user email", error);
      return new Response("Missing email for user", { status: 400 });
    }

    if (!resendApiKey) {
      console.warn("No RESEND_API_KEY - skipping email send");
      return new Response("Email skipped (no API key)", { status: 200 });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Chemical System <notifications@your-domain.com>",
        to: [profile.email],
        subject: record.title,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${profile.full_name},</h2>
            <p>${record.body}</p>
            ${record.link ? `<p><a href="https://your-domain.com${record.link}">View Details in Application</a></p>` : ""}
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">This is an automated notification from the Chemical Ordering & Monitoring System.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend api error:", errorText);
      return new Response("Resend external API error", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Internal Function Error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
