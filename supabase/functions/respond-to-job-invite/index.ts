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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase Environment Variables");
    }

    // Use Service Role to bypass RLS since homeowner is anonymous
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { token, action } = await req.json();

    if (!token || !action || !['approve', 'decline'].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate Token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("job_tokens")
      .select("job_id, status, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
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

    if (tokenData.status === 'approved' || tokenData.status === 'declined') {
        return new Response(JSON.stringify({ error: "Invite already responded to" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Update Token Status
    const newTokenStatus = action === 'approve' ? 'approved' : 'declined';
    const { error: updateTokenError } = await supabaseAdmin
      .from("job_tokens")
      .update({ status: newTokenStatus })
      .eq("token", token);

    if (updateTokenError) {
      console.error("Token update error:", updateTokenError);
      throw new Error("Failed to update token status");
    }

    // 3. Update Job Status (if approved)
    if (action === 'approve') {
        // Fetch current job status to verify transition
        const { data: job, error: jobError } = await supabaseAdmin
            .from("jobs")
            .select("status, contractor_id")
            .eq("id", tokenData.job_id)
            .single();

        if (jobError || !job) {
             console.error("Job fetch error:", jobError);
             throw new Error("Job not found");
        }

        // Only update if not already approved
        if (job.status !== 'approved') {
             // Update Job Status
             const { error: updateJobError } = await supabaseAdmin
                .from("jobs")
                .update({
                  status: 'approved',
                  updated_at: new Date().toISOString()
                })
                .eq("id", tokenData.job_id);

            if (updateJobError) {
              console.error("Job update error:", updateJobError);
              throw new Error("Failed to update job status");
            }

            // Log Event (using contractor_id as actor since they initiated the invite flow)
            const { error: eventError } = await supabaseAdmin
                .from("job_events")
                .insert({
                    job_id: tokenData.job_id,
                    previous_status: job.status,
                    new_status: 'approved',
                    created_by: job.contractor_id
                });

            if (eventError) {
              console.error("Event log error:", eventError);
              // Non-critical, continue
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
