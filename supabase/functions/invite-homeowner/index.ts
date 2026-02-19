import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { jobId } = await req.json();

    if (!jobId) {
        throw new Error("Missing jobId");
    }

    // 1. Verify job ownership and get details
    const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*, client:clients(email, name), property:properties(address_line1, city)")
        .eq("id", jobId)
        .single();

    if (jobError || !job) {
        throw new Error("Job not found or access denied");
    }

    if (!job.client?.email) {
        throw new Error("Client has no email address");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("business_name, full_name")
        .eq("id", job.contractor_id)
        .single();

    if (profileError) throw profileError;

    // 2. Create Token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: tokenData, error: tokenError } = await supabase
        .from("job_tokens")
        .insert({
            job_id: jobId,
            expires_at: expiresAt.toISOString(),
        })
        .select("token")
        .single();

    if (tokenError) throw tokenError;

    const inviteUrl = `${Deno.env.get("SITE_URL") ?? "http://localhost:3000"}/jobs/approve/${tokenData.token}`;

    // 3. Send Email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const contractorName = profile.business_name || profile.full_name || "Contractor";

    // HTML content
    const html = `
      <p>Hello ${job.client.name},</p>
      <p>${contractorName} has sent you a job for approval.</p>
      <p><strong>${job.title}</strong></p>
      <p>${job.description || ''}</p>
      <p>Please click the link below to review and approve:</p>
      <a href="${inviteUrl}">Review Job</a>
      <p>Best regards,<br/>ProsDispatch</p>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "ProsDispatch <onboarding@resend.dev>", // MVP1 default
      to: [job.client.email],
      subject: `Job Approval Request: ${job.title}`,
      html: html,
    });

    if (emailError) {
        console.error("Email error:", emailError);
        throw new Error("Failed to send email");
    }

    // 4. Update Job Status
    // Only update if current status is draft? Or allow resending?
    // Transition RPC handles valid transitions. draft -> sent is valid. sent -> sent is not valid usually.
    // If already sent, maybe just resending email.

    if (job.status === 'draft') {
        const { error: transitionError } = await supabase.rpc("transition_job_state", {
            job_id: jobId,
            new_status: "sent",
        });

        if (transitionError) {
            console.error("Transition error:", transitionError);
            // Log but don't fail, as email is sent.
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
