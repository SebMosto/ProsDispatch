// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyInviteToken } from "../_shared/invite.ts";
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const { token, action } = await req.json();
    if (!token || !action) {
      return new Response(JSON.stringify({ error: "Missing token or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!['approve', 'decline'].includes(action)) {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const payload = await verifyInviteToken(token, serviceRoleKey);
    if (!payload || !payload.job_id) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch job to check status
    const { data: job, error: jobError } = await supabaseAdmin
        .from("jobs")
        .select("status, contractor_id, title")
        .eq("id", payload.job_id)
        .single();

    if (jobError || !job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Only allow response if job is 'sent' (or 'draft' if retrying?)
    // Actually, if it's already approved, we should probably tell them "Already approved".
    if (job.status !== 'sent') {
         if (job.status === 'approved' && action === 'approve') {
             return new Response(JSON.stringify({ success: true, message: "Job already approved" }), {
                 status: 200,
                 headers: { ...corsHeaders, "Content-Type": "application/json" },
             });
         }
         return new Response(JSON.stringify({ error: `Job is currently ${job.status} and cannot be modified via this link.` }), {
             status: 400,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
    }

    const newStatus = action === 'approve' ? 'approved' : 'draft';

    const { error: updateError } = await supabaseAdmin
        .from("jobs")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", payload.job_id);

    if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
    }

    // TODO: Send email notification to contractor? (Nice to have, not in MVP explicitly)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in respond-to-invite:", error);
    const statusCode = getErrorStatus(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
