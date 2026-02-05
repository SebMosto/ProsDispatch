// supabase/functions/send-job-invite/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(JSON.stringify({ error: "Missing job_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch Job & Verify Ownership & Status
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("title, description, status, clients(email)")
      .eq("id", job_id)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status !== "draft") {
       return new Response(JSON.stringify({ error: "Job is not in draft status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate Token
    const token = crypto.randomUUID();

    // 4. Insert Token
    const { error: tokenError } = await supabase.from("job_tokens").insert({
      token,
      job_id: job_id,
    });

    if (tokenError) {
       throw new Error(`Token creation failed: ${tokenError.message}`);
    }

    // 5. Update Job Status to 'sent'
    const { error: updateError } = await supabase.from("jobs").update({
      status: "sent",
    }).eq("id", job_id);

    if (updateError) {
      throw new Error(`Job update failed: ${updateError.message}`);
    }

    // 6. Send Email
    if (job.clients?.email) {
      const resend = new Resend(resendApiKey);
      const approveUrl = `${siteUrl || 'http://localhost:5173'}/approve/${token}`;

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      try {
        await resend.emails.send({
          from: "Jobs <noreply@prosdispatch.com>",
          to: job.clients.email,
          subject: `Job Approval Request: ${job.title}`,
          html: `
            <h1>Job Approval Request</h1>
            <p>${profile?.business_name || profile?.full_name || 'Your Contractor'} has sent you a job for approval.</p>
            <p><strong>Job:</strong> ${job.title}</p>
            <p><strong>Description:</strong> ${job.description || 'No description provided.'}</p>
            <p><a href="${approveUrl}">Review & Approve Job</a></p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Continue, do not fail request.
      }
    }

    return new Response(JSON.stringify({ success: true, token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-job-invite:", error);
    const statusCode = getErrorStatus(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
