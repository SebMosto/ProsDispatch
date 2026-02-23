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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token, action } = await req.json();

    if (!token || !action) {
      throw new Error("Missing token or action");
    }

    if (!['approve', 'decline'].includes(action)) {
      throw new Error("Invalid action. Must be 'approve' or 'decline'.");
    }

    // 1. Verify Token and Get Job Info
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .select("id, job_id, status, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Invalid or expired token");
    }

    if (tokenData.status !== 'active') {
      throw new Error("Token is no longer active");
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error("Token has expired");
    }

    // 2. Fetch Job Details (contractor_id, current status)
    const { data: jobData, error: jobError } = await supabaseClient
      .from("jobs")
      .select("contractor_id, status")
      .eq("id", tokenData.job_id)
      .single();

    if (jobError || !jobData) {
      throw new Error("Job not found");
    }

    // 3. Determine New Status
    let newStatus = '';
    if (action === 'approve') {
      newStatus = 'approved';
    } else {
      newStatus = 'draft'; // Revert to draft if declined
    }

    // Only update if status is actually changing
    if (jobData.status !== newStatus) {
        // 4. Update Job Status
        const { error: updateJobError } = await supabaseClient
          .from("jobs")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", tokenData.job_id);

        if (updateJobError) {
          throw new Error("Failed to update job status");
        }

        // 5. Log Event (Attributed to contractor for now, as system action)
        const { error: eventError } = await supabaseClient
          .from("job_events")
          .insert({
            job_id: tokenData.job_id,
            previous_status: jobData.status,
            new_status: newStatus,
            created_by: jobData.contractor_id
          });

        if (eventError) {
            console.error("Failed to log job event", eventError);
        }
    }

    // 6. Mark Token as Used
    const { error: updateTokenError } = await supabaseClient
      .from("job_tokens")
      .update({ status: 'used' })
      .eq("id", tokenData.id);

    if (updateTokenError) {
       console.error("Failed to mark token as used", updateTokenError);
    }

    return new Response(JSON.stringify({ success: true, new_status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
