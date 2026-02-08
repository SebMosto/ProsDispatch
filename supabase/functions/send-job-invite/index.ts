// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { generateInviteToken } from "../_shared/invite.ts";
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !resendApiKey) {
      throw new Error("Missing required environment variables");
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

    // Check job ownership and status
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*, clients(email, first_name, last_name), properties(address_line1, city)")
      .eq("id", jobId)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status !== "draft") {
      return new Response(JSON.stringify({ error: "Job must be in draft status to send invite" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore: Supabase join types can be tricky
    const clientEmail = job.clients?.email;
    // @ts-ignore
    const clientName = job.clients?.first_name || "Valued Client";
    // @ts-ignore
    const jobTitle = job.title;
    // @ts-ignore
    const jobAddress = `${job.properties?.address_line1 || ""}, ${job.properties?.city || ""}`;

    if (!clientEmail) {
      return new Response(JSON.stringify({ error: "Client email missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update Job Status FIRST (before sending email)
    // This prevents sending invites for jobs that fail to update status
    // Use service role client to ensure update works even if RLS is strict (though user owns it)
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (updateError) {
      console.error("Update Status Error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update job status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate Token using Service Role Key
    const token = await generateInviteToken(job.id, serviceRoleKey);

    const inviteUrl = `${siteUrl}/jobs/approve?token=${token}`;

    const resend = new Resend(resendApiKey);

    const { error: emailError } = await resend.emails.send({
      from: "ProsDispatch <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Action Required: Job Approval for ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Job Approval Request</h2>
          <p>Hello ${clientName},</p>
          <p>You have a new job estimate waiting for your approval.</p>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Job:</strong> ${jobTitle}</p>
            <p style="margin: 0;"><strong>Location:</strong> ${jobAddress}</p>
          </div>
          <p>Please review the details and approve or decline the job by clicking the link below:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review & Approve Job</a>
          </p>
          <p style="font-size: 14px; color: #6b7280;">If you have any questions, please contact your service provider directly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Sent via ProsDispatch</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend Error:", emailError);
      // Email failed after DB update succeeded - job is now in 'sent' status but no email was delivered.
      // This is a less critical state than the reverse, as contractor can see the status change
      // and potentially retry sending. Log this heavily for manual intervention if needed.
      return new Response(JSON.stringify({ error: "Failed to send email: Job status updated to sent" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Invite sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-job-invite:", error);
    const statusCode = getErrorStatus(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
