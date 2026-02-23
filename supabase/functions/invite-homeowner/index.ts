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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { jobId } = await req.json();

    if (!jobId) {
      throw new Error("Missing jobId");
    }

    // 1. Verify Job Ownership
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("*, clients(name, email), properties(address_line1, city)")
      .eq("id", jobId)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found or access denied");
    }

    // 2. Create Invite Token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .insert({ job_id: jobId })
      .select()
      .single();

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      throw new Error("Failed to create invite token");
    }

    // Determine Invite URL
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:3000";
    const inviteUrl = `${origin}/job-invite/${tokenData.token}`;

    // 3. Send Email (Mocked if no key)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      // Send email using Resend
      const recipientEmail = job.clients.email || user.email; // Fallback to contractor for testing

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "ProsDispatch <onboarding@resend.dev>", // Should be configurable
          to: [recipientEmail],
          subject: `Job Approval Request: ${job.title}`,
          html: `
            <p>Hello ${job.clients.name || "Client"},</p>
            <p>Please review the job details and approve or decline:</p>
            <p><a href="${inviteUrl}">View Job Details</a></p>
            <p>Thank you,</p>
            <p>ProsDispatch</p>
          `,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Resend Error:", errorData);
        // Don't fail the request, just log it.
      }
    } else {
      console.log("Mocking Email Send to:", job.clients.email);
      console.log("Invite URL:", inviteUrl);
    }

    // 4. Update Job Status to 'sent'
    // Use RPC to ensure valid transition and logging
    // Only update if currently draft, otherwise invite is just re-sent
    if (job.status === 'draft') {
        const { error: updateError } = await supabaseClient.rpc("transition_job_state", {
          job_id: jobId,
          new_status: "sent",
        });

        if (updateError) {
          console.error("Status update error:", updateError);
        }
    }

    return new Response(JSON.stringify({ success: true, token: tokenData.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
