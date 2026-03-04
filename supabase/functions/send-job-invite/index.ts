import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

interface ClientData {
  name: string;
  email: string | null;
}

interface JobWithClient {
  id: string;
  title: string;
  contractor_id: string;
  client: ClientData | null;
}

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
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

    if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
      throw new Error("Missing environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // 2. Fetch job and client details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        contractor_id,
        client:clients (
          name,
          email
        )
      `)
      .eq("id", jobId)
      .eq("contractor_id", user.id)
      .returns<JobWithClient>()
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = job.client;

    if (!client?.email) {
      return new Response(JSON.stringify({ error: "Client does not have an email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate token
    const token = crypto.randomUUID();
    // Expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from("job_tokens")
      .insert({
        token,
        job_id: jobId,
        expires_at: expiresAt,
      });

    if (tokenError) {
      console.error("Token error:", tokenError);
      throw new Error("Failed to generate invitation token");
    }

    // 4. Update job status to 'sent'
    const { error: transitionError } = await supabase.rpc("transition_job_state", {
      job_id: jobId,
      new_status: "sent",
    });

    if (transitionError) {
      console.error("Transition error:", transitionError);
      // The token creation should ideally be rolled back here.
      // Throwing an error prevents the email from being sent and surfaces the failure.
      throw new Error(`Failed to update job status: ${transitionError.message}`);
    }

    // 5. Send email
    const resend = new Resend(resendApiKey);
    const inviteUrl = `${siteUrl}/jobs/approve/${token}`;
    const contractorName = user.user_metadata?.full_name || "Your Contractor"; // Fallback if profile not fetched

    const { error: emailError } = await resend.emails.send({
      from: "ProsDispatch <noreply@prosdispatch.com>", // Update with verified domain
      to: [client.email],
      subject: `Job Approval Request: ${job.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Job Approval Request</h2>
          <p>Hello ${client.name},</p>
          <p>${contractorName} has sent you a job for approval.</p>
          <p><strong>Job:</strong> ${job.title}</p>
          <p>Please click the button below to view details and approve/decline.</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Job Details</a>
          <p style="margin-top: 24px; font-size: 14px; color: #64748b;">Link expires in 7 days.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, message: "Invitation sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
