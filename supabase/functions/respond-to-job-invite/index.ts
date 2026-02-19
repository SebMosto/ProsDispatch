import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token, action } = await req.json();

    if (!token || !action) {
        throw new Error("Missing token or action");
    }

    if (!['approve', 'decline'].includes(action)) {
        throw new Error("Invalid action");
    }

    // 1. Get Token and Job
    const { data: jobToken, error: tokenError } = await supabase
        .from("job_tokens")
        .select("*, job:jobs(id, status, contractor_id)")
        .eq("token", token)
        .single();

    if (tokenError || !jobToken) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Validate Token
    if (jobToken.status !== 'active') {
         return new Response(JSON.stringify({ error: "Token is no longer active" }), {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const now = new Date();
    if (new Date(jobToken.expires_at) < now) {
         return new Response(JSON.stringify({ error: "Token expired" }), {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 3. Determine New Status
    let newStatus = jobToken.job.status;
    const currentStatus = jobToken.job.status;

    if (action === 'approve') {
        newStatus = 'approved';
    } else if (action === 'decline') {
        newStatus = 'draft';
    }

    // 4. Update Job and Log Event (if status changed)
    if (newStatus !== currentStatus) {
        // Update Job
        const { error: updateError } = await supabase
            .from("jobs")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", jobToken.job.id);

        if (updateError) {
             console.error("Update job error:", updateError);
             return new Response(JSON.stringify({ error: "Failed to update job status" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Log Event
        // We use contractor_id as created_by since the action is authorized by their token/invite.
        const { error: eventError } = await supabase
            .from("job_events")
            .insert({
                job_id: jobToken.job.id,
                previous_status: currentStatus,
                new_status: newStatus,
                created_by: jobToken.job.contractor_id
            });

        if (eventError) {
             console.error("Event log error:", eventError);
             // Non-critical
        }
    }

    // 5. Mark Token as Used
    const { error: updateTokenError } = await supabase
        .from("job_tokens")
        .update({ status: 'used' })
        .eq("token", token);

    if (updateTokenError) {
        console.error("Token update error:", updateTokenError);
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
