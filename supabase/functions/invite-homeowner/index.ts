import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing jobId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership and fetch details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        client:clients(name, email),
        property:properties(address_line1, city, province)
      `)
      .eq("id", jobId)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert token
    const { error: tokenError } = await supabase
      .from("job_tokens")
      .insert({
        token,
        job_id: jobId,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (tokenError) {
      throw tokenError;
    }

    // Send email via Resend
    if (resendApiKey && job.client?.email) {
      const resend = new Resend(resendApiKey);
      const inviteUrl = `${siteUrl}/job-invite/${token}`;

      await resend.emails.send({
        from: "ProsDispatch <no-reply@prosdispatch.com>",
        to: job.client.email,
        subject: `Job Approval Request: ${job.title}`,
        html: `
          <h1>Job Approval Request</h1>
          <p>Hi ${job.client.name},</p>
          <p>You have a new job approval request for <strong>${job.title}</strong> at ${job.property.address_line1}.</p>
          <p>Please review and approve the job details by clicking the link below:</p>
          <a href="${inviteUrl}">View Job Details</a>
          <p>This link will expire in 7 days.</p>
        `,
      });
    }

    // Update job status to 'sent'
    // We use the RPC transition_job_state as per PRD
    const { error: updateError } = await supabase.rpc('transition_job_state', {
        job_id: jobId,
        new_status: 'sent'
    });

    if (updateError) {
        console.error("Failed to update job status:", updateError);
        // We don't fail the request if email sent and token created, but it's not ideal.
    }

    return new Response(JSON.stringify({ success: true, token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
