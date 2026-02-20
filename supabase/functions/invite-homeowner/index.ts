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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !authHeader) {
      throw new Error("Missing environment variables or authorization header");
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { job_id } = await req.json();

    if (!job_id) {
      throw new Error("Missing job_id");
    }

    // Verify ownership and status
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, status, contractor_id")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (job.status !== "draft") {
       return new Response(JSON.stringify({ error: "Job must be in draft status to invite homeowner" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .insert({ job_id })
      .select("token")
      .single();

    if (tokenError) {
      throw tokenError;
    }

    // Update Job Status to 'sent' via RPC to ensure state machine validity and logging
    const { error: updateError } = await supabaseClient.rpc("transition_job_state", {
      job_id,
      new_status: "sent",
    });

    if (updateError) {
       console.error("Error updating job status:", updateError);
       // We still return success for the invite generation, but warn?
       // Or fail? If we fail, the token exists but status is draft.
       // Let's fail.
       throw updateError;
    }

    // Mock Email Send (log to console)
    // In a real implementation, we would use Resend here.
    console.log(`[Invite] Sending email to homeowner for job ${job_id} with token ${tokenData.token}`);

    return new Response(JSON.stringify({ message: "Invite sent", token: tokenData.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
