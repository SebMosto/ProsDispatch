import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RespondRequest {
  token: string;
  action: "approve" | "decline";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { token, action } = await req.json() as RespondRequest;

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

    // Validate Token
    const { data: tokenData, error: tokenError } = await supabase
      .from("job_tokens")
      .select(`*, jobs(id, contractor_id)`)
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Invalid, used, or expired token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobId = tokenData.job_id;

    // Execute Action
    if (action === "approve") {
      const { error: transitionError } = await supabase.rpc("transition_job_state", {
        job_id: jobId,
        new_status: "approved",
      });

      if (transitionError) {
        throw transitionError;
      }
    } else if (action === "decline") {
      const { error: transitionError } = await supabase.rpc("transition_job_state", {
        job_id: jobId,
        new_status: "draft",
      });

      if (transitionError) {
        throw transitionError;
      }
    }

    // Mark token as used
    await supabase
      .from("job_tokens")
      .update({ status: "used" })
      .eq("token", token);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in respond-to-job-invite:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
