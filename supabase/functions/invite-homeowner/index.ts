import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  job_id: string;
}

const templates = {
  en: {
    subject: (title: string) => `Job Estimate: ${title}`,
    body: (name: string, title: string, date: string, link: string) => `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Hello ${name},</h2>
        <p>You have received a new job estimate.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Job:</strong> ${title}</p>
          <p><strong>Service Date:</strong> ${date || "To be determined"}</p>
        </div>
        <p>Please click the button below to view the details and approve the work:</p>
        <a href="${link}" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Estimate</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">This link expires in 7 days.</p>
      </div>
    `,
  },
  fr: {
    subject: (title: string) => `Estimation de travail : ${title}`,
    body: (name: string, title: string, date: string, link: string) => `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Bonjour ${name},</h2>
        <p>Vous avez reçu une nouvelle estimation de travail.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Travail :</strong> ${title}</p>
          <p><strong>Date de service :</strong> ${date || "À déterminer"}</p>
        </div>
        <p>Veuillez cliquer sur le bouton ci-dessous pour voir les détails et approuver le travail :</p>
        <a href="${link}" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir l'estimation</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Ce lien expire dans 7 jours.</p>
      </div>
    `,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify authentication (Contractor)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id } = await req.json() as InviteRequest;

    if (!job_id) {
      return new Response(JSON.stringify({ error: "Missing job_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Job and Client details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        clients (
          name,
          email,
          preferred_language
        )
      `)
      .eq("id", job_id)
      .eq("contractor_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientEmail = job.clients?.email;
    if (!clientEmail) {
      return new Response(JSON.stringify({ error: "Client has no email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: tokenData, error: tokenError } = await supabase
      .from("job_tokens")
      .insert({
        job_id: job.id,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select("token")
      .single();

    if (tokenError) {
      throw tokenError;
    }

    // Transition Job Status
    const { error: transitionError } = await supabase.rpc("transition_job_state", {
      job_id: job.id,
      new_status: "sent",
    });

    if (transitionError) {
        console.error("Transition error:", transitionError);
        // Continue anyway to send email, or maybe fail?
        // Ideally we should be transactional, but edge functions are not.
        // If transition fails, maybe we shouldn't send email?
        // But token is created.
        // Let's assume transition is critical.
        throw transitionError;
    }

    // Send Email
    const locale = (job.clients?.preferred_language as "en" | "fr") || "en";
    const template = templates[locale] || templates.en;
    const inviteUrl = `${SITE_URL}/job-invite/${tokenData.token}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ProsDispatch <onboarding@resend.dev>",
        to: clientEmail,
        subject: template.subject(job.title),
        html: template.body(job.clients?.name || "Client", job.title, job.service_date, inviteUrl),
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`Resend API Error: ${errorData}`);
    }

    return new Response(JSON.stringify({ success: true, token: tokenData.token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in invite-homeowner:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
