import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

interface ClientData {
  name: string;
}

interface JobWithClient {
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, action } = await req.json();

    if (!token || !action) {
      return new Response(JSON.stringify({ error: "Missing token or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate token
    const { data: jobToken, error: tokenError } = await supabase
      .from("job_tokens")
      .select("job_id, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !jobToken) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(jobToken.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Handle Action
    if (action === "approve") {
      // Use the token-specific RPC that skips the auth.uid() ownership check.
      // The token validation above is the authorisation mechanism here.
      const { error: transitionError } = await supabase.rpc("approve_job_via_token", {
        p_job_id: jobToken.job_id,
      });

      if (transitionError) {
        throw new Error("Failed to update job status: " + transitionError.message);
      }

      // 3. Notify Contractor
      // Fetch contractor email
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select(`
          title,
          contractor_id,
          client:clients (name)
        `)
        .eq("id", jobToken.job_id)
        .returns<JobWithClient>()
        .single();

      if (jobError || !job) {
        console.error("Failed to fetch job for notification", jobError);
      } else {
        const { data: contractor } = await supabase.from("profiles").select("email, full_name").eq("id", job.contractor_id).single();
        // Fallback to auth email? But auth email is not stored in profiles table usually.
        // Wait, `profiles` table might not have email.
        // `profiles` table usually has `full_name`.
        // The `auth.users` table has email, but `supabase` client with service role can access it via `auth.admin`?
        // No, `createClient` with service role can use `auth.admin.getUserById(id)`.

        const { data: user, error: userError } = await supabase.auth.admin.getUserById(job.contractor_id);

        if (userError || !user?.user?.email) {
          console.error("Failed to fetch contractor email", userError);
        } else {
          const resend = new Resend(resendApiKey);
          const client = job.client;
          const clientName = client?.name || "Client";
          const jobTitle = job.title;

          await resend.emails.send({
            from: "ProsDispatch <noreply@prosdispatch.com>",
            to: [user.user.email],
            subject: `Job Approved: ${jobTitle}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Job Approved!</h2>
                <p>Hello ${contractor?.full_name || "Contractor"},</p>
                <p>Good news! <strong>${clientName}</strong> has approved the job <strong>${jobTitle}</strong>.</p>
                <p>You can now proceed with the work.</p>
                <a href="${siteUrl}/jobs/${jobToken.job_id}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Job</a>
              </div>
            `,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Job approved" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
