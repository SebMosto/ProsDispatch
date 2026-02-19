// supabase/functions/respond-to-job-invite/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const { token, action } = body;

    if (!token || !action) {
        return new Response(JSON.stringify({ error: "Missing token or action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!['accepted', 'declined'].includes(action)) {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify Token
    const { data: tokenData, error: tokenError } = await serviceClient
        .from("job_tokens")
        .select("*, jobs(status, contractor_id)")
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
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (tokenData.status === 'accepted' || tokenData.status === 'declined') {
         return new Response(JSON.stringify({ error: "Invite already responded to" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Update Token Status
    const { error: updateError } = await serviceClient
        .from("job_tokens")
        .update({ status: action })
        .eq("token", token);

    if (updateError) {
        throw updateError;
    }

    // 3. Update Job Status (if accepted)
    if (action === 'accepted') {
        const { error: transitionError } = await serviceClient.rpc("transition_job_state", {
            job_id: tokenData.job_id,
            new_status: "approved"
        });

        if (transitionError) {
            console.error("Transition error:", transitionError);
            // Optionally rollback token status? For MVP, we proceed.
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
