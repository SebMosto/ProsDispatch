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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { jobId } = await req.json();
    if (!jobId) throw new Error("Job ID is required");

    // Check job ownership and status
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("*, clients(email, first_name), contractors:profiles(business_name, full_name)")
      .eq("id", jobId)
      .single();

    if (jobError || !job) throw new Error("Job not found");
    if (job.contractor_id !== user.id) throw new Error("Unauthorized");

    // Generate Token
    const token = crypto.randomUUID();

    // Insert Token
    const { error: tokenError } = await supabaseClient
      .from("job_tokens")
      .insert({
        job_id: jobId,
        token: token,
        status: 'active'
      });

    if (tokenError) throw tokenError;

    // Update Job Status
    // We attempt to transition to 'sent'. If it fails (e.g. already sent), we catch and ignore if it's just a state issue
    try {
        const { error: updateError } = await supabaseClient.rpc('transition_job_state', {
            job_id: jobId,
            new_status: 'sent'
        });
        if (updateError) {
            console.warn("Could not transition job state (might already be sent):", updateError);
        }
    } catch (e) {
        console.warn("Exception during job state transition:", e);
    }

    // Send Email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const inviteUrl = `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/jobs/approve/${token}`;

    // Construct email content
    // Note: In production, use a verified domain. For now, testing with onboarding@resend.dev or similar if configured.
    // Assuming RESEND_FROM is set or using a default.
    const fromEmail = "onboarding@resend.dev";
    const clientName = job.clients?.first_name || "Valued Client";
    const contractorName = job.contractors?.business_name || job.contractors?.full_name || "Your Contractor";

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [job.clients.email], // This will only work if verified or testing
      subject: `Job Approval Request from ${contractorName}`,
      html: `
        <h1>Job Approval Request</h1>
        <p>Hi ${clientName},</p>
        <p>${contractorName} has sent you a job for approval.</p>
        <p><strong>Job:</strong> ${job.title}</p>
        <p>Please review and approve the job details by clicking the link below:</p>
        <a href="${inviteUrl}">Review Job</a>
        <p>Link expires in 7 days.</p>
      `,
    });

    if (emailError) {
        console.error("Resend Error:", emailError);
        throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
