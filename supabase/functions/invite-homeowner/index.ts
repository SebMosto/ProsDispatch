import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "resend";

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
    // Use SITE_URL from env or default to localhost for dev
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase Environment Variables");
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

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse Request
    const { jobId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing jobId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify Job Ownership and Get Details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        clients (
          email,
          name
        ),
        properties (
          address_line1
        ),
        profiles (
          business_name,
          full_name
        )
      `)
      .eq("id", jobId)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found or unauthorized" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create Token
    // We insert a new token. RLS allows insert for own jobs.
    const { data: tokenData, error: tokenError } = await supabase
      .from("job_tokens")
      .insert({
        job_id: jobId,
        status: "pending"
      })
      .select("token")
      .single();

    if (tokenError || !tokenData) {
      console.error("Token creation error:", tokenError);
      throw new Error("Failed to create invite token");
    }

    const inviteUrl = `${siteUrl}/job-invite/${tokenData.token}`;
    const contractorName = job.profiles?.business_name || job.profiles?.full_name || "Your Contractor";
    const clientEmail = job.clients?.email;

    // 5. Send Email via Resend
    if (resendApiKey && clientEmail) {
      const resend = new Resend(resendApiKey);
      try {
        const { error: emailError } = await resend.emails.send({
          from: "ProsDispatch <invites@prosdispatch.com>", // TODO: Configure verified domain
          to: [clientEmail],
          subject: `${contractorName} sent you a job invite`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Job Invite from ${contractorName}</h2>
              <p>You have been invited to view and approve a job at <strong>${job.properties?.address_line1}</strong>.</p>
              <p><strong>Job Title:</strong> ${job.title}</p>
              <div style="margin: 20px 0;">
                <a href="${inviteUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Job Details</a>
              </div>
              <p style="font-size: 12px; color: #666;">If the button doesn't work, copy this link: ${inviteUrl}</p>
            </div>
          `,
        });

        if (emailError) {
          console.error("Resend API error:", emailError);
          // We don't fail the request, just log it.
        }
      } catch (err) {
        console.error("Resend exception:", err);
      }
    } else {
      console.log(`[MOCK EMAIL] To: ${clientEmail}, Link: ${inviteUrl}`);
    }

    // 6. Update Job Status to 'sent'
    if (job.status === 'draft') {
      const { error: updateError } = await supabase.rpc('transition_job_state', {
        job_id: jobId,
        new_status: 'sent'
      });

      if (updateError) {
        console.error("Failed to update job status:", updateError);
        // Invite was sent (token created), so we still return success, but log the error.
      }
    }

    return new Response(JSON.stringify({ success: true, token: tokenData.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
