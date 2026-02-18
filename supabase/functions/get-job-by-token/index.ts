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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token } = await req.json();
    if (!token) throw new Error("Token is required");

    // Fetch Token and related data
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
          contractor_id,
          client_id,
          property_id
        )
      `)
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) throw new Error("Invalid token");

    // Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error("Token expired");
    }

    // Fetch related entities separately if needed, or join in the first query if the relationships are set up correctly.
    // The previous query might fail if relationships are ambiguous or RLS blocks deeply nested joins even with service role (it shouldn't).
    // Let's do a second fetch for details to be safe and clean.

    const job = tokenData.jobs;
    if (!job) throw new Error("Job not found");

    const { data: contractor } = await supabaseClient.from("profiles").select("business_name, full_name, email").eq("id", job.contractor_id).single();
    const { data: client } = await supabaseClient.from("clients").select("first_name, last_name").eq("id", job.client_id).single();
    const { data: property } = await supabaseClient.from("properties").select("address_line_1, city, province, postal_code").eq("id", job.property_id).single();

    const responseData = {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        service_date: job.service_date,
        status: job.status,
        contractor: {
          name: contractor?.business_name || contractor?.full_name || "Contractor",
          email: contractor?.email
        },
        client: {
          name: client ? `${client.first_name} ${client.last_name}` : "Client",
        },
        property: {
          address: property ? `${property.address_line_1}, ${property.city}, ${property.province}` : "Property"
        }
      },
      token_status: tokenData.status
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-job-by-token:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
