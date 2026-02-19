// supabase/functions/invite-homeowner/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Authenticate
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

    // 2. Verify Ownership & Get Job Details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        clients (
            name,
            email
        ),
        properties (
            address_line1,
            city
        )
      `)
      .eq("id", jobId)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!job.clients?.email) {
      return new Response(JSON.stringify({ error: "Client email is missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create Token (using Service Role)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokenData, error: tokenError } = await serviceClient
      .from("job_tokens")
      .insert({
        job_id: jobId,
        status: "pending"
      })
      .select("token")
      .single();

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      throw new Error("Failed to create invite token");
    }

    const inviteUrl = `${siteUrl}/job-invite/${tokenData.token}`;

    // 4. Send Email
    if (resendApiKey) {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: "ProsDispatch <invites@prosdispatch.com>", // In prod, use verified domain
                to: [job.clients.email],
                subject: `Job Approval Request: ${job.title}`,
                html: `<p>Hello ${job.clients.name},</p>
                       <p>Please review and approve the job details for ${job.properties.address_line1}.</p>
                       <p><a href="${inviteUrl}">View Job & Approve</a></p>`
            })
        });

        if (!res.ok) {
            console.error("Resend error:", await res.text());
            // Proceed even if email fails, as we return the token/url?
            // Or maybe fail?
            // Let's proceed but log it.
        }
    } else {
        console.log(`[MOCK EMAIL] To: ${job.clients.email}, Link: ${inviteUrl}`);
    }

    // 5. Update Job Status
    // Only update if current status is 'draft'
    if (job.status === 'draft') {
        const { error: transitionError } = await serviceClient.rpc("transition_job_state", {
            job_id: jobId,
            new_status: "sent"
        });

        if (transitionError) {
            console.error("Transition error:", transitionError);
        }
    }

    return new Response(JSON.stringify({ success: true, token: tokenData.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
