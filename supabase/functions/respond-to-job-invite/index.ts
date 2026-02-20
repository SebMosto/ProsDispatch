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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { token, response } = await req.json();

    if (!token || !response) {
      return new Response(JSON.stringify({ error: "Token and response are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!['approve', 'decline'].includes(response)) {
       return new Response(JSON.stringify({ error: "Invalid response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify Token
    const { data: tokenRecord, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .select("job_id, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRecord) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
       return new Response(JSON.stringify({ error: "Token expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410, // Gone
      });
    }

    const jobId = tokenRecord.job_id;
    let newStatus = 'approved';

    if (response === 'decline') {
        newStatus = 'draft'; // Revert to draft if declined
    }

    // Get current status and contractor_id for event logging
    const { data: job, error: jobFetchError } = await supabaseClient
        .from('jobs')
        .select('contractor_id, status')
        .eq('id', jobId)
        .single();

    if (jobFetchError || !job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
        });
    }

    // Update Job Status directly (bypassing RPC auth check since we are Service Role)
    const { error: updateError } = await supabaseClient
        .from('jobs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', jobId);

    if (updateError) {
        throw updateError;
    }

    // Log Event
    // We attribute the event to the contractor since it's their job,
    // even though it was triggered by an external action.
    const { error: eventError } = await supabaseClient
        .from('job_events')
        .insert({
            job_id: jobId,
            new_status: newStatus,
            previous_status: job.status,
            created_by: job.contractor_id
        });

    if (eventError) {
        console.error("Error logging event:", eventError);
    }

    return new Response(JSON.stringify({ message: "Success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
