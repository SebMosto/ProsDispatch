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
    // Use Service Role Key to bypass RLS, as this is a public endpoint authenticated by the token itself.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token } = await req.json();

    if (!token) {
      throw new Error("Missing token");
    }

    // 1. Verify Token and Fetch Data
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .select(`
        status,
        expires_at,
        jobs (
          id,
          title,
          description,
          service_date,
          status,
          clients (
            name
          ),
          properties (
            address_line1,
            city,
            province,
            postal_code
          )
        )
      `)
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      // Return a generic error to avoid leaking existence of tokens
      throw new Error("Invalid or expired token");
    }

    if (tokenData.status !== 'active') {
      throw new Error("Token is no longer active");
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error("Token has expired");
    }

    // Return limited job details
    // Check for nulls in case relations are missing (should not happen due to constraints)
    const job = tokenData.jobs;
    if (!job) {
       throw new Error("Job not found");
    }
    const client = job.clients;
    const property = job.properties;

    const responseData = {
      id: job.id,
      title: job.title,
      description: job.description,
      service_date: job.service_date,
      status: job.status,
      client: {
        name: client?.name || "Valued Client",
      },
      property: {
        address: property ? `${property.address_line1}, ${property.city}, ${property.province} ${property.postal_code}` : "Address not available",
      },
      token_status: tokenData.status,
    };

    return new Response(JSON.stringify(responseData), {
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
