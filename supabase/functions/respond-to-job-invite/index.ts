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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token, action } = await req.json();
    if (!token || !action) throw new Error("Token and action are required");
    if (!['approve', 'decline'].includes(action)) throw new Error("Invalid action");

    // Fetch Token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .select("*, jobs(*)")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) throw new Error("Invalid token");
    if (tokenData.status !== 'active') throw new Error("Token already used or expired");

    const job = tokenData.jobs;
    // Map action to job status
    const newStatus = action === 'approve' ? 'approved' : 'draft';

    // Update Job Status directly (bypassing RLS/RPC restrictions as service role)
    const { error: updateJobError } = await supabaseClient
      .from("jobs")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id);

    if (updateJobError) throw updateJobError;

    // Log Event
    await supabaseClient.from("job_events").insert({
      job_id: job.id,
      previous_status: job.status,
      new_status: newStatus,
      // created_by: null // System
    });

    // Update Token Status
    await supabaseClient
      .from("job_tokens")
      .update({ status: 'used' })
      .eq("id", tokenData.id);

    // Fetch Contractor Email
    const { data: contractor } = await supabaseClient
      .from("profiles")
      .select("email, full_name, business_name")
      .eq("id", job.contractor_id)
      .single();

    if (contractor && contractor.email) {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const contractorName = contractor.business_name || contractor.full_name || "Contractor";

      const subject = action === 'approve'
        ? `Job Approved: ${job.title}`
        : `Job Declined: ${job.title}`;

      const html = `
        <h1>Job ${action === 'approve' ? 'Approved' : 'Declined'}</h1>
        <p>Hello ${contractorName},</p>
        <p>The homeowner has ${action}d the job: <strong>${job.title}</strong>.</p>
        <p>Status is now: <strong>${newStatus}</strong>.</p>
        <p><a href="${Deno.env.get("SITE_URL")}/jobs/${job.id}">View Job</a></p>
      `;

      // Use a safe sender address for testing/dev if needed, otherwise rely on RESEND_FROM env or default
      const fromEmail = "onboarding@resend.dev";

      await resend.emails.send({
        from: fromEmail,
        to: [contractor.email],
        subject: subject,
        html: html,
      });
    }

    return new Response(JSON.stringify({ success: true, newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in respond-to-job-invite:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
