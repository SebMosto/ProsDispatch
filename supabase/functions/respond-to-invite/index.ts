// supabase/functions/respond-to-invite/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getErrorStatus } from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { token, action } = await req.json();

    if (!token || !action) {
      return new Response(JSON.stringify({ error: "Missing token or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["approve", "decline"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate Token & Get Job ID
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("job_tokens")
      .select("job_id, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
       return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Update Job Status
    const newStatus = action === "approve" ? "approved" : "archived";

    const { error: updateError } = await supabaseAdmin
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", tokenData.job_id);

    if (updateError) {
      throw new Error(`Job update failed: ${updateError.message}`);
    }

    // 3. Mark Token as Opened/Used
    await supabaseAdmin
      .from("job_tokens")
      .update({ opened_at: new Date().toISOString() })
      .eq("token", token);

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in respond-to-invite:", error);
    const statusCode = getErrorStatus(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
